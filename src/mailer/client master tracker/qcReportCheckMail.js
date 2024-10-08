const nodemailer = require("nodemailer");
const connection = require("../../config/db"); // Import the existing MySQL connection

// Function to send email
async function qcReportCheckMail(
  module,
  action,
  gender_title,
  client_name,
  application_id,
  toArr,
  ccArr
) {
  try {
    // Fetch email template
    const [emailRows] = await connection
      .promise()
      .query(
        "SELECT * FROM emails WHERE module = ? AND action = ? AND status = 1",
        [module, action]
      );
    if (emailRows.length === 0) throw new Error("Email template not found");
    const email = emailRows[0];

    // Fetch SMTP credentials
    const [smtpRows] = await connection
      .promise()
      .query(
        "SELECT * FROM smtp_credentials WHERE module = ? AND action = ? AND status = '1'",
        [module, action]
      );
    if (smtpRows.length === 0) throw new Error("SMTP credentials not found");
    const smtp = smtpRows[0];

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure, // true for 465, false for other ports
      auth: {
        user: smtp.username,
        pass: smtp.password,
      },
    });

    // Replace placeholders in the email template
    let template = email.template
      .replace(/{{gender_title}}/g, gender_title)
      .replace(/{{client_name}}/g, client_name)
      .replace(/{{application_id}}/g, application_id);

    // Prepare CC list
    const ccList = ccArr
      .map((entry) => {
        let emails = [];

        try {
          if (Array.isArray(entry.email)) {
            emails = entry.email;
          } else if (typeof entry.email === "string") {
            let cleanedEmail = entry.email
              .trim()
              .replace(/\\"/g, '"')
              .replace(/^"|"$/g, "");

            if (cleanedEmail.startsWith("[") && cleanedEmail.endsWith("]")) {
              emails = JSON.parse(cleanedEmail);
            } else {
              emails = [cleanedEmail];
            }
          }
        } catch (e) {
          console.error("Error parsing email JSON:", entry.email, e);
          return ""; // Skip this entry if parsing fails
        }

        return emails
          .filter((email) => email) // Ensure it's a valid non-empty string
          .map((email) => `"${entry.name}" <${email}>`)
          .join(", ");
      })
      .filter((cc) => cc !== "") // Remove any empty CCs from failed parses
      .join(", ");

    // Validate recipient email(s)
    if (!toArr || toArr.length === 0) {
      throw new Error("No recipient email provided");
    }

    // Prepare recipient list
    const toList = toArr
      .map((email) => `"${email.name}" <${email.email}>`)
      .join(", ");

    // Debugging: Log the email lists
    console.log("Recipient List:", toList);
    console.log("CC List:", ccList);

    const attachmentsUrl =
      "https://i0.wp.com/goldquestglobal.in/wp-content/uploads/2024/03/goldquestglobal.png,https://www.antennahouse.com/hubfs/xsl-fo-sample/pdf/basic-link-1.pdf";

    // Function to check if a file exists
    const checkFileExists = async (url) => {
      try {
        const response = await fetch(url, { method: "HEAD" });
        return response.ok; // Returns true if the status is in the range 200-299
      } catch {
        return false; // Return false if there was an error (e.g., network issue)
      }
    };

    // Main function to create attachments
    const createAttachments = async () => {
      const urls = attachmentsUrl.split(",");
      const attachments = [];

      for (const url of urls) {
        if (await checkFileExists(url)) {
          const filename = url.split("/").pop(); // Extract the filename from the URL
          attachments.push({
            filename: filename,
            path: url,
          });
        }
      }

      return attachments;
    };

    // Create attachments
    const attachments = await createAttachments();

    // Send email
    const mailOptions = {
      from: smtp.username,
      to: toList,
      cc: ccList,
      subject: email.title,
      html: template,
      ...(attachments.length > 0 && { attachments }), // Only include attachments if present
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("Email sent:", info.response);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

module.exports = { qcReportCheckMail };