const express = require("express");
const router = express.Router();
const clientController = require("../../../controllers/customer/branch/client/applicationController");

// Basic routes
router.post("/create", clientController.create);
router.get("/list", clientController.list);
router.put("/update", packageController.update);
router.delete("/delete", clientController.delete);

module.exports = router;
