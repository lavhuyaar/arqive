const { getNestedFolders, getFiles } = require("../db/queries");
const asyncHandler = require("express-async-handler");

exports.renderHomePage = asyncHandler(async (req, res, next) => {
  res.render("index");
});

exports.renderLoginPage = asyncHandler(async (req, res, next) =>
  res.render("login", { user: req.user })
);

exports.renderSignUpPage = asyncHandler(async (req, res, next) =>
  res.render("sign-up")
);
