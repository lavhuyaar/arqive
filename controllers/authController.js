const passport = require("passport");
const bcrypt = require("bcryptjs");
const { createUser, getUserById, getUserByUsername } = require("../db/queries");
const LocalStrategy = require("passport-local").Strategy;
const { validationResult } = require("express-validator");
const { validateSignUp } = require("../validators/authValidator");

// ----------PASSPORT JS SETUP-----------------
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await getUserByUsername(username);
      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      }
      const match = await bcrypt.compare(password, user.password.trim());
      if (!match) {
        return done(null, false, { message: "Incorrect password" });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await getUserById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// --------------CONTROLLERS-----------------
//Logs in User
exports.loginUser = async (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }

    const { username, password } = req.body;
    if (!user) {
      return res.render("login", {
        errors: [{ msg: info.message }],
        prevData: { username, password },
      }); // Pass error message
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.redirect("/folder");
    });
  })(req, res, next);
};

//Creates a new User
exports.signUpUser = [
  validateSignUp,
  async (req, res, next) => {
    const { firstName, lastName, username, password, confirm_password } =
      req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty())
      return res.status(404).render("sign-up", {
        errors: errors.array(),
        user: req.user,
        prevData: {
          firstName,
          lastName,
          username,
          password,
          confirm_password,
        },
      });

    //Checks if username already exists
    const isUsernameUnavailable = await getUserByUsername(username);
    if (isUsernameUnavailable) {
      return res.status(404).render("sign-up", {
        errors: [{ msg: "This username already exists" }],
        user: req.user,
        prevData: {
          firstName,
          lastName,
          username,
          password,
          confirm_password,
        },
      });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10); //Hashed password
      await createUser(username, firstName, lastName, hashedPassword);
      return res.render("sign-up", {
        errors: null,
        user: req.user,
        successMessage: true,
      });
    } catch (err) {
      console.error(err);
      next(err);
    }
  },
];

//Logs out user
exports.logoutUser = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    return res.redirect("/");
  });
};
