const Package = require("../../models/admin/packageModel");
const Common = require("../../models/admin/commonModel");

// Controller to create a new package
exports.create = (req, res) => {
  const { title, description, admin_id, _token } = req.body;

  // Validate required fields
  const missingFields = [];
  if (!title) missingFields.push("Title");
  if (!description) missingFields.push("Description");
  if (!admin_id) missingFields.push("Admin ID");
  if (!_token) missingFields.push("Token");

  if (missingFields.length > 0) {
    return res.status(400).json({
      status: false,
      message: `Missing required fields: ${missingFields.join(", ")}`,
    });
  }

  const action = JSON.stringify({ package: "create" });

  // Check admin authorization
  Common.isAdminAuthorizedForAction(admin_id, action, (result) => {
    if (!result.status) {
      // Check the status returned by the authorization function
      return res.status(403).json({
        status: false,
        message: result.message, // Return the message from the authorization function
      });
    }

    // Validate admin token
    Common.isAdminTokenValid(_token, admin_id, (err, tokenValidationResult) => {
      if (err) {
        console.error("Token validation error:", err);
        return res.status(500).json({
          status: false,
          message: err.message,
        });
      }

      if (!tokenValidationResult.status) {
        return res.status(401).json({
          status: false,
          message: tokenValidationResult.message,
        });
      }

      const newToken = tokenValidationResult.newToken;

      // Create package
      Package.create(title, description, admin_id, (err, result) => {
        if (err) {
          console.error("Database error during package creation:", err);
          Common.adminActivityLog(
            admin_id,
            "Package",
            "Create",
            "0",
            null,
            err.message,
            () => {}
          );
          return res.status(500).json({
            status: false,
            message: "Failed to create package. Please try again.",
          });
        }

        Common.adminActivityLog(
          admin_id,
          "Package",
          "Create",
          "1",
          `{id: ${result.insertId}}`,
          null,
          () => {}
        );

        res.json({
          status: true,
          message:
            "Customer and branches created successfully, and email sent.",
          data: {
            customer: result,
            meta: metaResult,
            branches: branchResults,
          },
          token: newToken,
        });
      });
    });
  });
};

// Controller to list all packages
exports.list = (req, res) => {
  const { admin_id, _token } = req.query;

  let missingFields = [];
  if (!admin_id) missingFields.push("Admin ID");
  if (!_token) missingFields.push("Token");

  if (missingFields.length > 0) {
    return res.status(400).json({
      status: false,
      message: `Missing required fields: ${missingFields.join(", ")}`,
    });
  }
  const action = JSON.stringify({ package: "view" });
  AdminCommon.isAdminAuthorizedForAction(admin_id, action, (result) => {
    if (!result.status) {
      return res.status(403).json({
        status: false,
        message: result.message, // Return the message from the authorization function
      });
    }
    Common.isAdminTokenValid(_token, admin_id, (err, result) => {
      if (err) {
        console.error("Error checking token validity:", err);
        return res.status(500).json(err);
      }

      if (!result.status) {
        return res.status(401).json({ status: false, message: result.message });
      }

      const newToken = result.newToken;

      Package.list((err, result) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ status: false, message: err.message });
        }

        res.json({
          status: true,
          message: "Packages fetched successfully",
          packages: result,
          totalResults: result.length,
          token: newToken,
        });
      });
    });
  });
};

// Controller to get a package by ID
exports.getPackageById = (req, res) => {
  const { id, admin_id, _token } = req.query;
  let missingFields = [];
  if (!id) missingFields.push("Package ID");
  if (!admin_id) missingFields.push("Admin ID");
  if (!_token) missingFields.push("Token");

  if (missingFields.length > 0) {
    return res.status(400).json({
      status: false,
      message: `Missing required fields: ${missingFields.join(", ")}`,
    });
  }
  const action = JSON.stringify({ package: "view" });
  AdminCommon.isAdminAuthorizedForAction(admin_id, action, (result) => {
    if (!result.status) {
      return res.status(403).json({
        status: false,
        message: result.message, // Return the message from the authorization function
      });
    }
    Common.isAdminTokenValid(_token, admin_id, (err, result) => {
      if (err) {
        console.error("Error checking token validity:", err);
        return res.status(500).json(err);
      }

      if (!result.status) {
        return res.status(401).json({ status: false, message: result.message });
      }

      const newToken = result.newToken;

      Package.getPackageById(id, (err, currentPackage) => {
        if (err) {
          console.error("Error fetching package data:", err);
          return res.status(500).json(err);
        }

        if (!currentPackage) {
          return res.status(404).json({
            status: false,
            message: "Package not found",
          });
        }

        res.json({
          status: true,
          message: "Package retrieved successfully",
          package: currentPackage,
          token: newToken,
        });
      });
    });
  });
};

// Controller to update a package
exports.update = (req, res) => {
  const { id, title, description, admin_id, _token } = req.body;

  // Validate required fields
  const missingFields = [];
  if (!id) missingFields.push("Package ID");
  if (!title) missingFields.push("Title");
  if (!description) missingFields.push("Description");
  if (!admin_id) missingFields.push("Admin ID");
  if (!_token) missingFields.push("Token");

  if (missingFields.length > 0) {
    return res.status(400).json({
      status: false,
      message: `Missing required fields: ${missingFields.join(", ")}`,
    });
  }

  const action = JSON.stringify({ package: "update" });

  // Check admin authorization
  Common.isAdminAuthorizedForAction(admin_id, action, (result) => {
    if (!result.status) {
      // Check the status returned by the authorization function
      return res.status(403).json({
        status: false,
        message: result.message, // Return the message from the authorization function
      });
    }

    // Validate admin token
    Common.isAdminTokenValid(_token, admin_id, (err, tokenValidationResult) => {
      if (err) {
        console.error("Token validation error:", err);
        return res.status(500).json({
          status: false,
          message: err.message,
        });
      }

      if (!tokenValidationResult.status) {
        return res.status(401).json({
          status: false,
          message: tokenValidationResult.message,
        });
      }

      const newToken = tokenValidationResult.newToken;

      // Fetch the current package
      Package.getPackageById(id, (err, currentPackage) => {
        if (err) {
          console.error("Database error during package retrieval:", err);
          return res.status(500).json({
            status: false,
            message: "Failed to retrieve package. Please try again.",
          });
        }

        if (!currentPackage) {
          return res.status(404).json({
            status: false,
            message: "Package not found.",
          });
        }

        const changes = {};
        if (currentPackage.title !== title) {
          changes.title = { old: currentPackage.title, new: title };
        }
        if (currentPackage.description !== description) {
          changes.description = {
            old: currentPackage.description,
            new: description,
          };
        }

        // Update the package
        Package.update(id, title, description, (err, result) => {
          if (err) {
            console.error("Database error during package update:", err);
            Common.adminActivityLog(
              admin_id,
              "Package",
              "Update",
              "0",
              JSON.stringify({ id, ...changes }),
              err.message,
              () => {}
            );
            return res.status(500).json({
              status: false,
              message: "Failed to update package. Please try again.",
            });
          }

          Common.adminActivityLog(
            admin_id,
            "Package",
            "Update",
            "1",
            JSON.stringify({ id, ...changes }),
            null,
            () => {}
          );

          res.status(200).json({
            status: true,
            message: "Package updated successfully.",
            package: result,
            token: newToken,
          });
        });
      });
    });
  });
};

// Controller to delete a package
exports.delete = (req, res) => {
  const { id, admin_id, _token } = req.query;

  // Validate required fields
  const missingFields = [];
  if (!id) missingFields.push("Package ID");
  if (!admin_id) missingFields.push("Admin ID");
  if (!_token) missingFields.push("Token");

  if (missingFields.length > 0) {
    return res.status(400).json({
      status: false,
      message: `Missing required fields: ${missingFields.join(", ")}`,
    });
  }

  const action = JSON.stringify({ package: "delete" });

  // Check admin authorization
  Common.isAdminAuthorizedForAction(admin_id, action, (result) => {
    if (!result.status) {
      // Check the status returned by the authorization function
      return res.status(403).json({
        status: false,
        message: result.message, // Return the message from the authorization function
      });
    }

    // Validate admin token
    Common.isAdminTokenValid(_token, admin_id, (err, tokenValidationResult) => {
      if (err) {
        console.error("Token validation error:", err);
        return res.status(500).json({
          status: false,
          message: err.message,
        });
      }

      if (!tokenValidationResult.status) {
        return res.status(401).json({
          status: false,
          message: tokenValidationResult.message,
        });
      }

      const newToken = tokenValidationResult.newToken;

      // Fetch the current package
      Package.getPackageById(id, (err, currentPackage) => {
        if (err) {
          console.error("Database error during package retrieval:", err);
          return res.status(500).json({
            status: false,
            message: "Failed to retrieve package. Please try again.",
          });
        }

        if (!currentPackage) {
          return res.status(404).json({
            status: false,
            message: "Package not found.",
          });
        }

        // Delete the package
        Package.delete(id, (err, result) => {
          if (err) {
            console.error("Database error during package deletion:", err);
            Common.adminActivityLog(
              admin_id,
              "Package",
              "Delete",
              "0",
              JSON.stringify({ id }),
              err.message,
              () => {}
            );
            return res.status(500).json({
              status: false,
              message: "Failed to delete package. Please try again.",
            });
          }

          Common.adminActivityLog(
            admin_id,
            "Package",
            "Delete",
            "1",
            JSON.stringify({ id }),
            null,
            () => {}
          );

          res.status(200).json({
            status: true,
            message: "Package deleted successfully.",
            result,
            token: newToken,
          });
        });
      });
    });
  });
};
