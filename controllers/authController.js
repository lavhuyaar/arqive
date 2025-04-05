const { prisma } = require("../lib/prisma");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const LocalStrategy = require("passport-local").Strategy;

// ----------PASSPORT JS SETUP-----------------
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await prisma.user.findFirst({
        where: {
          username,
        },
      });
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
    const user = await prisma.user.findFirst({
      where: {
        id,
      },
    });
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
    if (!user) {
      return res.render("login", { errors: [{ msg: info.message }] }); // Pass error message
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.redirect("/");
    });
  })(req, res, next);
};

//Creates a new User
exports.signUpUser = async (req, res, next) => {
  // const errors = validationResult(req);
  // if (!errors.isEmpty())
  //   return res.status(404).render("sign-up", { errors: errors.array() });

  const { firstName, lastName, username, password } = req.body;

  //Checks if username already exists
  const isUsernameUnavailable = await prisma.user.findFirst({
    where: {
      username,
    },
  });
  if (isUsernameUnavailable) {
    return res.status(404).render("sign-up", {
      errors: [{ msg: "This username already exists" }],
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10); //Hashed password
    await prisma.user.create({
      data: {
        username,
        firstName,
        lastName,
        password: hashedPassword,
      },
    });
    res.redirect("/login");
  } catch (err) {
    console.error(err);
    next(err);
  }
};

//Logs out user
exports.logoutUser = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
};
