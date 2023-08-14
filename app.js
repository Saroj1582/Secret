import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import encrypt from "mongoose-encryption";

const app = express();

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

// console.log(process.env.SECRET);

const userSchema = new mongoose.Schema(
    {
        email: String,
        password: String
    }

);

const secretString = process.env.SECRET;
userSchema.plugin(encrypt, {secret: secretString, encryptedFields: ["password"]});

const User = mongoose.model("User", userSchema);

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
        console.log(result);
        if (result!=null) {
            if (result.password==req.body.password) {
                res.render("secrets");
            } else {
                res.send("Password doesn't match");
            }
        } else {
            res.send("Username doesn't exist, please registe!");
        }
    } catch (error) {
        res.send(error);
    }

    
});

app.post("/register", async (req, res) => {
    
    const newUser = new User(
        {
            email: req.body.username,
            password: req.body.password
        }
    );

    try {
        const result = await newUser.save();
        console.log(result);
        res.render("secrets");
    } catch (error) {
        res.send(error);
    }

    

    
})

app.listen(3000, () => {
    console.log("Server started at port 3000");
})