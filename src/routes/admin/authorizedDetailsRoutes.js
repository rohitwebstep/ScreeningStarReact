const express = require("express");
const router = express.Router();
const authorizedDetailsController = require("../../controllers/admin/authorizedDetailsController");

// Authentication routes
router.post("/create", authorizedDetailsController.create);
router.get("/list", authorizedDetailsController.list);
router.get(
  "/authorized-detail-info",
  authorizedDetailsController.getBillingSpocById
);
router.put("/update", authorizedDetailsController.update);
router.delete("/delete", authorizedDetailsController.delete);

module.exports = router;
