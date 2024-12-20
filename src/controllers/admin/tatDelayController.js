const tatDelay = require("../../models/admin/tatDelayModel");
const Common = require("../../models/admin/commonModel");

// Controller to list all tatDelays
exports.list = (req, res) => {
  const { admin_id, _token } = req.query;

  let missingFields = [];
  if (!admin_id || admin_id === "") missingFields.push("Admin ID");
  if (!_token || _token === "") missingFields.push("Token");

  if (missingFields.length > 0) {
    return res.status(400).json({
      status: false,
      message: `Missing required fields: ${missingFields.join(", ")}`,
    });
  }
  const action = "admin_manager";
  Common.isAdminAuthorizedForAction(admin_id, action, (result) => {
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

      tatDelay.list((err, result) => {
        if (err) {
          console.error("Database error:", err);
          return res
            .status(500)
            .json({ status: false, message: err.message, token: newToken });
        }

        res.json({
          status: true,
          message: "Delay TATs fetched successfully",
          tatDelays: result,
          totalResults: result.length,
          token: newToken,
        });
      });
    });
  });
};

exports.listWithoutAuth = (req, res) => {
  const { YWRtaW5faWQ } = req.query;

  // Decode the Base64 string
  const decoded_admin_id = Buffer.from(YWRtaW5faWQ, "base64").toString("utf8");

  // Convert the decoded value to a number
  const admin_id_number = parseFloat(decoded_admin_id);

  // Divide by 1.5
  const admin_id = admin_id_number / 1.5;

  // Check if admin_id is valid
  if (isNaN(admin_id) || !admin_id) {
    return res.status(400).json({
      status: false,
      message: "Please provide a valid admin id",
    });
  }

  let missingFields = [];
  if (!admin_id || admin_id === "") missingFields.push("Admin ID");

  if (missingFields.length > 0) {
    return res.status(400).json({
      status: false,
      message: `Missing required fields: ${missingFields.join(", ")}`,
    });
  }

  const action = "admin_manager";
  Common.isAdminAuthorizedForAction(admin_id, action, (result) => {
    if (!result.status) {
      return res.status(403).json({
        status: false,
        message: result.message, // Return the message from the authorization function
      });
    }

    tatDelay.list((err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          status: false,
          message: err.message,
        });
      }

      res.json({
        status: true,
        message: "Delay TATs fetched successfully",
        tatDelays: result,
        totalResults: result.length,
      });
    });
  });
};
