const {
  loginUser,
  signUpUser,
  logoutUser,
} = require("../controllers/authController");
const {
  getFolderData,
  createFolder,
} = require("../controllers/folderController");
const {
  renderHomePage,
  renderLoginPage,
  renderSignUpPage,
} = require("../controllers/indexController");

const indexRoute = require("express").Router();

indexRoute.get("/", renderHomePage);
indexRoute.get("/login", renderLoginPage);
indexRoute.post("/login", loginUser);
indexRoute.get("/sign-up", renderSignUpPage);
indexRoute.post("/sign-up", signUpUser);
indexRoute.get("/logout", logoutUser);
// indexRoute.post("/create-folder", createFolder);

module.exports = indexRoute;
