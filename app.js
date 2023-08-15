import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";

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
        email: String,
        password: String
    }

);

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/secrets", (req, res) => {
    res.render("secrets");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/login", async (req, res) => {
    
    try {
        const result = await User.findOne({email: req.body.username});
        
        if (result!=null) {
            const match = await bcrypt.compare(req.body.password, result.password);
            console.log(match);
            if (match) {
                res.render("secrets");
            } else {
                res.send("Invaid Password");
            }
               
        } else {
            res.send("Username doesn't exist, please registe!");
        }
    } catch (error) {
        res.send(error);
    }

    
});

app.post("/register", async (req, res) => {

    try {
        const hash = await bcrypt.hash(req.body.password, saltRounds);
        console.log(hash);
        const newUser = new User(
            {
                email: req.body.username,
                password: hash
            }
        );

        const result = await newUser.save();
        console.log(result);
        res.render("secrets");
    } catch (error) {
        res.send(error);
    }
    
});

app.listen(3000, () => {
    console.log("Server started at port 3000");
})