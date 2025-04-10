const { body } = require("express-validator");

const validFileTypes = [
  "image/jpg",
  "image/jpeg",
  "image/avif",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
];

const validateFolder = [
  body("newFolderName")
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage("First name must be between 2 and 20 characters"),
];

const validateFile = [
  body("file")
    .custom((value, { req }) => {
      if (validFileTypes.some((t) => t === req.file.mimetype)) {
        return true;
      } else {
        return false;
      }
    })
    .withMessage(
      "Image of type JPG, JPEG, AVIF, WEBP, and PNG can be added. TXT and PDF can also be added"
    ),
];

module.exports = {
  validateFolder,
  validateFile,
};
