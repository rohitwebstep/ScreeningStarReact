const fs = require("fs");
const path = require("path");
const multer = require("multer");
const ftp = require("basic-ftp");
const App = require("../models/appModel");

// Fetch app information (database query) once
let cloudImageFTPHost,
  cloudImageFTPUser,
  cloudImageFTPPassword,
  cloudImageFTPSecure;

App.appInfo("backend", (err, appInfo) => {
  if (err) {
    console.error("Database error:", err);
    return;
  }
  cloudImageFTPHost = appInfo.cloud_ftp_host;
  cloudImageFTPUser = appInfo.cloud_ftp_user;
  cloudImageFTPPassword = appInfo.cloud_ftp_password;
  cloudImageFTPSecure = appInfo.cloud_ftp_secure;
  // Check if any FTP details are missing and handle the error
  if (!cloudImageFTPHost || !cloudImageFTPUser || !cloudImageFTPPassword) {
    console.error("FTP configuration missing required details.");
    return;
  }

  // Set cloudImageFTPSecure based on its value (0 = false, anything else = true)
  cloudImageFTPSecure = cloudImageFTPSecure === 0 ? false : true;
});

// Set up multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads"; // Original upload directory
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true }); // Create directory if it doesn't exist
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const randomNumber = Math.floor(Math.random() * 10000); // Random number
    const extension = path.extname(file.originalname); // Get the file extension
    const filename = `${timestamp}_${randomNumber}${extension}`; // Create filename
    cb(null, filename); // Return the filename
  },
});

const fileFilter = (req, file, cb) => {
  const allowedFileTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/bmp",
    "image/tiff",
    "image/webp",
    "image/svg+xml",
    "image/x-icon",
    "image/heic",
    "image/heif",
    "image/apng",
    "application/zip",
  ];

  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    cb(
      new Error(
        "Invalid file type. Only PDF, images, and zip files are allowed."
      )
    );
  }
};

// Multer setup
const upload = multer({
  storage,
  limits: { fileSize: 512 * 1024 * 1024 }, // 512 MB limit
  fileFilter,
});
// Function to save a single image and upload it to FTP
const saveImage = async (file, targetDir) => {
  return new Promise((resolve, reject) => {
    if (file) {
      const originalPath = path.join("uploads", file.filename); // Original file path
      const newPath = path.join(targetDir, file.filename); // New file path

      // Ensure target directory exists
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true }); // Create directory if it doesn't exist
      }

      // Move the file to the new directory
      fs.rename(originalPath, newPath, async (err) => {
        if (err) {
          console.error("Error renaming file:", err);
          return reject(err); // Reject on error
        }

        // Upload the image to FTP after saving locally
        try {
          await uploadToFtp(newPath); // FTP upload after saving locally
          fs.unlinkSync(newPath);
          resolve(newPath); // Return the new file path
        } catch (err) {
          console.error("Error uploading to FTP:", err);
          reject(err); // Reject if FTP upload fails
        }
      });
    } else {
      reject(new Error("No file provided for saving."));
    }
  });
};

const saveZip = async (file, targetDir) => {
  return new Promise((resolve, reject) => {
    if (file) {
      const originalPath = path.join("uploads", file.filename); // Original file path
      const newPath = path.join(targetDir, file.filename); // New file path

      // Ensure target directory exists
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true }); // Create directory if it doesn't exist
      }

      // Move the file to the new directory
      fs.rename(originalPath, newPath, async (err) => {
        if (err) {
          console.error("Error renaming file:", err);
          return reject(err); // Reject on error
        }

        // Upload the image to FTP after saving locally
        try {
          await uploadToFtp(newPath); // FTP upload after saving locally
          fs.unlinkSync(newPath);
          resolve(newPath); // Return the new file path
        } catch (err) {
          console.error("Error uploading to FTP:", err);
          reject(err); // Reject if FTP upload fails
        }
      });
    } else {
      reject(new Error("No file provided for saving."));
    }
  });
};

// Function to upload an image to Hostinger via FTP
const uploadToFtp = async (filePath) => {
  const client = new ftp.Client();
  client.ftp.verbose = true; // Enable verbose logging for FTP connection

  try {
    // Connect to FTP server using previously fetched app information
    await client.access({
      host: cloudImageFTPHost,
      user: cloudImageFTPUser,
      password: cloudImageFTPPassword,
      secure: cloudImageFTPSecure,
    });

    const targetDir = path.dirname(filePath); // Get the directory path (e.g., "uploads/rohit")
    const filename = path.basename(filePath); // Get the filename (e.g., "1734421514518_5912.png")

    const dirs = targetDir.split(path.sep);
    for (const dir of dirs) {
      await client.ensureDir(dir); // Ensure each directory exists
    }

    // Upload the image file to Hostinger's public_html folder
    await client.uploadFrom(filePath, filename);
  } catch (err) {
    console.error("FTP upload failed:", err);
    throw err; // Rethrow the error
  } finally {
    client.close(); // Close the FTP connection
  }
};

// Function to save multiple images and upload them to FTP
const saveImages = async (files, targetDir) => {
  const savedImagePaths = [];
  for (const file of files) {
    const savedImagePath = await saveImage(file, targetDir); // Save and upload each file
    savedImagePaths.push(savedImagePath);
  }
  return savedImagePaths; // Return an array of saved image paths
};

const savePdf = async (doc, pdfFileName, targetDir) => {
  // Create the target directory on the FTP server first
  const dirs = targetDir.split(path.sep); // Split targetDir into directory parts
  const client = new ftp.Client();
  client.ftp.verbose = true; // Enable verbose logging for FTP connection

  try {
    // Connect to FTP server using previously fetched app information
    await client.access({
      host: cloudImageFTPHost,
      user: cloudImageFTPUser,
      password: cloudImageFTPPassword,
      secure: cloudImageFTPSecure,
    });

    // Ensure the directories exist on the FTP server
    for (const dir of dirs) {
      await client.ensureDir(dir); // Ensure each directory exists on FTP
    }

    // Create a temporary path to save the PDF file locally
    const pdfPath = path.join(targetDir, pdfFileName);

    // Save the document (PDF) to a temporary local path
    await doc.save(pdfPath); // You can adjust this to directly generate the file

    // Upload the file directly to the FTP server
    await client.uploadFrom(pdfPath, pdfFileName);

    // After successful upload, remove the local file
    fs.unlinkSync(pdfPath); // Delete the temporary local file
    return pdfPath;
  } catch (err) {
    console.error("Error during FTP upload:", err);
    throw err; // Rethrow the error if upload fails
  } finally {
    client.close(); // Close the FTP connection
  }
};

// Exporting the upload middleware and saving functions
module.exports = {
  upload: upload.fields([
    { name: "pdf", maxCount: 5 },
    { name: "images", maxCount: 10 },
    { name: "zip", maxCount: 1 },
  ]),
  saveZip,
  saveImage,
  saveImages,
  savePdf,
};
