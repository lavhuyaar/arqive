const { prisma } = require("../lib/prisma");
// ---------------------------------------------------------------

exports.renderHomePage = (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }
  return res.render("index", { user: req.user });
};

exports.renderLoginPage = (req, res) => res.render("login", { user: req.user });

exports.renderSignUpPage = (req, res) => res.render("sign-up");
