const { body } = require("express-validator");

const validateSignUp = [
  body("firstName")
    .trim()
    .isAlpha()
    .withMessage("First name must contain only alphabets")
    .isLength({ min: 2, max: 15 })
    .withMessage("First name must be between 2 and 15 characters"),
  body("lastName")
    .trim()
    .isAlpha()
    .withMessage("Last name must contain only alphabets")
    .isLength({ min: 2, max: 15 })
    .withMessage("Last name must be between 2 and 15 characters"),
  body("username")
    .trim()
    .isLength({ min: 2, max: 15 })
    .withMessage("Username must be between 2 and 15 characters"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be atleast 6 letters"),
  body("confirm_password")
    .custom((value, { req }) => {
      return value === req.body.password;
    })
    .withMessage("Passwords must match"),
];

module.exports = {validateSignUp};