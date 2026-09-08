const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadPath = path.join(__dirname, "../uploads/sidebar");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);

    const fileName =
      `sidebar-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;

    cb(null, fileName);
  }
});

const upload = multer({
  storage
});

module.exports = upload;


// const multer = require("multer");

// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: {
//     fileSize: 2 * 1024 * 1024
//   }
// });

// module.exports = upload;