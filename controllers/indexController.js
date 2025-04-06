const { prisma } = require("../lib/prisma");
// ---------------------------------------------------------------

exports.renderHomePage = async (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }
  const data = await prisma.folder.findMany({
    where: {
      userId: req.user.id,
      parentId: null,
    },
  });
  res.render("index", { user: req.user, folders: data, parentFolder: null });
};

exports.renderLoginPage = (req, res) => res.render("login", { user: req.user });

exports.renderSignUpPage = (req, res) => res.render("sign-up");
