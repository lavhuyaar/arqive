const {
  loginUser,
  signUpUser,
  logoutUser,
} = require("../controllers/authController");
const {
  renderHomePage,
  renderLoginPage,
  renderSignUpPage,
} = require("../controllers/indexController");
const { userLoggedIn } = require("../utils/userLoggedIn");

const indexRoute = require("express").Router();

indexRoute.get("/", userLoggedIn, renderHomePage);
indexRoute.get("/login", renderLoginPage);
indexRoute.post("/login", loginUser);
indexRoute.get("/sign-up", renderSignUpPage);
indexRoute.post("/sign-up", signUpUser);
indexRoute.get("/logout", logoutUser);

module.exports = indexRoute;
