const { getNestedFolders } = require("../db/queries");
const asyncHandler = require("express-async-handler");

exports.renderHomePage = asyncHandler(async (req, res, next) => {
  const data = await getNestedFolders(req.user.id, null);
  res.render("index", { user: req.user, folders: data, parentFolder: null });
});

exports.renderLoginPage = asyncHandler(async (req, res, next) =>
  res.render("login", { user: req.user })
);

exports.renderSignUpPage = asyncHandler(async (req, res, next) =>
  res.render("sign-up")
);
