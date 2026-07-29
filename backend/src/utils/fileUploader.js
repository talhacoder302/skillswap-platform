const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../public/profile-images")); // apna folder path rakh dein
  },

  filename: (req, file, cb) => {
    const fileName =
      Date.now() + "-" + file.originalname.replace(/\s+/g, "_");

    cb(null, fileName);
  },
});

const uploadProfileImage = multer({ storage });

module.exports = {
  uploadProfileImage,
};