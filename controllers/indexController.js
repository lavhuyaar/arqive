const asyncHandler = require("express-async-handler");

exports.renderHomePage = asyncHandler(async (req, res, next) => {
  res.render("index", { user: req.user });
});

exports.renderLoginPage = asyncHandler(async (req, res, next) =>
  res.render("login", { user: req.user })
);

exports.renderSignUpPage = asyncHandler(async (req, res, next) =>
  res.render("sign-up", { user: req.user })
);

//Page not found
exports.renderNotFoundPage = asyncHandler(async (req, res, next) => {
  res.status(404).render("pageNotFound", {
    title: "Page not found",
    message: "Page not found",
    status: 404,
    user: req.user,
  });
});
