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
    )
    .custom((value, { req }) => {
      if (req.file.size > 2 * 1024 * 1024) { //Exceeds 2 MB
        return false;
      } else {
        return true;
      }
    })
    .withMessage(
      "File size cannot exceed 2MB"
    ),
];

module.exports = {
  validateFolder,
  validateFile,
};
