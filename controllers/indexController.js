const { getNestedFolders, getFiles } = require("../db/queries");
const asyncHandler = require("express-async-handler");

exports.renderHomePage = asyncHandler(async (req, res, next) => {
  const folders = await getNestedFolders(req.user.id, null);
  const files = await getFiles(req.user.id, null);

  res.render("index", {
    user: req.user,
    folders: folders,
    parentFolder: null,
    files: files,
  });
});

exports.renderLoginPage = asyncHandler(async (req, res, next) =>
  res.render("login", { user: req.user })
);

exports.renderSignUpPage = asyncHandler(async (req, res, next) =>
  res.render("sign-up")
);
