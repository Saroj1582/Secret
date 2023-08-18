import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import passport from "passport";
import LocalStrategy from "passport-local";
import passportLocalMongoose from "passport-local-mongoose";
import GoogleStrategy from 'passport-google-oauth20';
import FacebookStrategy from "passport-facebook";
import findOrCreate from "mongoose-findorcreate";

const app = express();



app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session(
    {
        secret: "Our little secret.",
        resave: false,
        saveUninitialized: false
        
    }
));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/userDB");
// console.log(process.env.SECRET);

const userSchema = new mongoose.Schema(
    {
        username: String,
        password: String,
        googleId: String,
        facebookId: String,
        secret: Array
    }

);

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username, name: user.name });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/", (req, res) => {
    res.render("home");
});

app.get("/auth/google",

  passport.authenticate("google", { scope: ["profile"] })
  
);

app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect("/secrets");
  });

  app.get('/auth/facebook',

  passport.authenticate('facebook')
  
  );

  app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get('/secrets', async (req, res) => {
    // Only authenticated users can access the admin dashboard
    try {
        const result = await User.find({"secret": {$ne: null}});
        console.log(result);
        res.render("secrets", {users: result});
    } catch (error) {
        console.log(error);
    }

});


app.get("/logout", (req, res) => {


    req.logOut((err) => {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/");
        }
    });
    
});

app.get("/submit", (req, res) => {

    if (req.isAuthenticated()) {
        res.render('submit');
      } else {
        res.redirect('/login');
      }
});

app.post("/submit", async (req, res) => {

    // console.log(req.user);
    try {
        const result = await User.findById(req.user.id);
        // console.log(result);
        result.secret.push(req.body.secret);
        result.save();
        res.redirect("/secrets");
    } catch (error) {
        console.log(error);
    }

});

app.post("/login", passport.authenticate("local"), function(req, res){
    res.redirect("/secrets");
});


// app.post("/login", (req, res) => {
    
//     const user = new User(
//         {
//             username: req.body.username,
//             password: req.body.password
//         }
//     );

//     req.logIn(user, (err) => {
//         if (err) {
//             res.send(err);
//         } else {
//             passport.authenticate("local")(req, res, () => {
//                 res.redirect("/secrets");
//             });
//         }
//     })
    
// });

app.post("/register", (req, res) => {

  User.register({username: req.body.username}, req.body.password, (err, user) => {
    if (err) {
        console.log(err);
        res.redirect("/register");
    } else {
        console.log(user);
        passport.authenticate("local")(req, res, () => {
            res.redirect("/secrets");
        });
    }
  });
      
});


app.listen(3000, () => {
    console.log("Server started at port 3000");
})