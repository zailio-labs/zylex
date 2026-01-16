const express = require("express");
const router = express.Router();
const customizeController = require("../controller/customize");
const multer = require("multer");
const { loginCheck, isAdmin } = require("../middleware/auth");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads/customize");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Public routes
router.get("/get-slide-image", customizeController.getImages);
router.get("/dashboard-data", customizeController.getAllData);

// Protected admin routes
router.post(
  "/upload-slide-image",
  loginCheck,
  isAdmin,
  upload.single("image"),
  customizeController.uploadSlideImage
);

router.post(
  "/delete-slide-image",
  loginCheck,
  isAdmin,
  customizeController.deleteSlideImage
);

module.exports = router;
