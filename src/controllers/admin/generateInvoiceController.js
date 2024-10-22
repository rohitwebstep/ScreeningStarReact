const crypto = require("crypto");
const generateInvoiceModel = require("../../models/admin/generateInvoiceModel");
const Customer = require("../../models/customer/customerModel");
const ClientApplication = require("../../models/customer/branch/clientApplicationModel");
const Branch = require("../../models/customer/branch/branchModel");
const AdminCommon = require("../../models/admin/commonModel");
const BranchCommon = require("../../models/customer/branch/commonModel");
const {
  finalReportMail,
} = require("../../mailer/client master tracker/finalReportMail");
const {
  qcReportCheckMail,
} = require("../../mailer/client master tracker/qcReportCheckMail");
const {
  readyForReport,
} = require("../../mailer/client master tracker/readyForReport");

const fs = require("fs");
const path = require("path");
const { upload, saveImage, saveImages } = require("../../utils/imageSave");

// Controller to list all customers
exports.generateInvoice = (req, res) => {
  const { customer_id, admin_id, _token } = req.query;

  // Check for missing fields
  const missingFields = [];
  if (!admin_id) missingFields.push("Admin ID");
  if (!_token) missingFields.push("Token");

  // Return error if there are missing fields
  if (missingFields.length > 0) {
    return res.status(400).json({
      status: false,
      message: `Missing required fields: ${missingFields.join(", ")}`,
    });
  }

  // Action for admin authorization
  const action = JSON.stringify({ invoice: "generate" });
  AdminCommon.isAdminAuthorizedForAction(admin_id, action, (authResult) => {
    if (!authResult.status) {
      return res.status(403).json({
        status: false,
        message: authResult.message, // Return the message from the authorization function
      });
    }

    // Verify admin token
    AdminCommon.isAdminTokenValid(_token, admin_id, (err, tokenResult) => {
      if (err) {
        console.error("Error checking token validity:", err);
        return res.status(500).json({ status: false, message: err.message });
      }

      if (!tokenResult.status) {
        return res
          .status(401)
          .json({ status: false, message: tokenResult.message });
      }

      const newToken = tokenResult.newToken;

      // Fetch customer list with filter status
      generateInvoiceModel.generateInvoice(customer_id, (err, results) => {
        if (err) {
          console.error("Database error:", err);
          return res
            .status(500)
            .json({ status: false, message: err.message, token: newToken });
        }

        // Respond with the fetched customer data and applications
        return res.json({
          status: true,
          message: "Data fetched successfully",
          customer: results.customerInfo, // Customer info
          applications: results.applications, // Client applications
          totalApplications: results.applications.length, // Count of applications
          token: newToken,
        });
      });
    });
  });
};