//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const flash = require('connect-flash');


// const bcrypt = require('bcrypt');
// const md5 = require("md5");

const app = express();



app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

app.use(session({
  secret: "This is our little secret",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

const password = process.env.DB_PASS;
mongoose.connect("mongodb+srv://admin-allen:" + password + "@cluster0-5gksb.mongodb.net/loginDB");
// mongoose.connect("mongodb://localhost:27017/loginDB", {useNewUrlParser: true});
//deprecation warning
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    // required: [true]
  },
  name: {
    type: String,
     required: [true]
  },

  password: {
    type: String,
    // required: [true]
  }
});
const itemsSchema = new mongoose.Schema({
  itemName: String,
  itemPrice: Number,
  imageURL: String
});

userSchema.plugin(passportLocalMongoose);


const User = new mongoose.model("User", userSchema);
const Item = new mongoose.model("Item", itemsSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.route("/items")
.get(function(req,res){
  res.render("postItems");
})
.post(function(req,res){
  var newItem = new Item({
    itemName: req.body.itemName,
    itemPrice: req.body.itemPrice,
    imageURL: req.body.itemURL
  });
  newItem.save(function(err){
    if(err){
      console.log(err);
    }
    else{
      res.redirect("/");
    }
  });
});
app.route("/")
  .get(function(req, res) {
    res.render("login");
  })
  .post(function(req, res) {
    const user = new User({
      username: req.body.username,
      password: req.body.password
    });
    req.login(user, function(err){
      if(err){
        console.log(err);
      }
      else{
        passport.authenticate("local", function(err, user, info){
          if(err){
            return next(err);
          }
          if(!user){
            return res.render("login",{error: "Invalid credentials"});
          }
          res.redirect("/welcome");
        })(req,res);
      }
    });
  });
  app.route("/logout")
  .get( function(req, res){
  req.logout();
  res.redirect('/');
});
  app.route("/welcome")
  .get(function(req,res){
    if(req.isAuthenticated()){
      var name = _.upperFirst(req.user.name);
      Item.find({}, function(err, foundItems){
        if(!err){
          res.render("welcome",{name: name, items: foundItems});
        }else{
          console.log(err);
        }
      });
    }else{
      res.redirect("/");
    }
  });
app.route("/signup")
  .get(function(req, res) {

    res.render("signup");
  })
  .post(function(req, res) {
      User.register(new User({username: req.body.username, name:req.body.name}), req.body.password, function(err, user){
        if(err){
          // TODO: handle user already exists ajax maybe?
          res.render("signup", {user : undefined, success :true,successs :true,error: err});
          // return ({error: "User already exists"});
        }else{
          passport.authenticate("local")(req,res, function(){
            res.redirect("/welcome");
          });

        }
      });

    });
app.route("/users")
  .get(function(req, res) {
    User.find({}, function(err, foundUsers) {
      if (!err) {
        res.json(foundUsers);
      } else {
        console.log(err);
        res.send(err);
      }
    });
  })
  .post(function(req, res) {
    User.countDocuments({
      username: req.body.username
    }, function(err, count) {
      if (count > 0) {
        res.send("User already exists");
      } else {
        User.register(new User({username: req.body.username, name:req.body.name}), req.body.password, function(err, user){
          if(err){
            console.log(err);
            res.send(err);
          }else{
            res.send("successfully registered user");
          }
        });
      }
    });
  })
  .delete(function(req, res) {
    User.deleteMany({}, function(err) {
      if (!err) {
        res.send("successfully deleted all users");
      } else {
        res.send(err);
      }
    });
  });
app.route("/users/:username")
  .get(function(req, res) {
    const requestedUsername = req.params.username;
    User.countDocuments({
      username: requestedUsername
    }, function(err, count) {
      if (count > 0) {
        //document exists });

        User.findOne({
          username: requestedUsername
        }, function(err, user) {
          if (!err) {
            res.json(user);

          } else {
            res.send(err);
          }
        });
      } else {
        res.send("User does not exist");
      }
    });
  })
  .put(function(req, res) {
    const requestedUsername = req.params.username;
    User.countDocuments({
      username: requestedUsername
    }, function(err, count) {
      if (count > 0) {
        User.update({
            username: requestedUsername
          }, {
            username: req.body.username,
            name: req.body.name,
            password: req.body.password
          }, {
            overwrite: true
          },
          function(err) {
            if (!err) {
              res.send("Successfully updated article");
            } else {
              res.send(err);
            }
          }
        );
      } else {
        res.send("Email does not exist");
      }
    });
  })
  .patch(function(req, res) {
    const requestedUsername = req.params.username;
    User.countDocuments({
      username: requestedUsername
    }, function(err, count) {
      if (count > 0) {
        User.update({
            username: requestedUsername
          }, {
            $set: req.body
          }, {
            runValidators: true
          },
          function(err) {
            if (!err) {
              res.send("successfully updated patch");
            } else {
              res.send(err);
            }
          }
        );

      } else {
        res.send("Email does not exist");
      }
    });
  })
  .delete(function(req, res) {
    const requestedUsername = req.params.username;
    User.countDocuments({
      username: requestedUsername
    }, function(err, count) {
      if (count > 0) {
        User.deleteOne({
            username: requestedUsername
          },
          function(err) {
            if (!err) {
              res.send("successfully deleted");
            } else {
              res.send(err);
            }
          }
        );
      } else {
        res.send("Email does not exist");
      }
    });
  });

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
app.listen(port);

// app.listen(port, function() {
//   console.log("server started successfully");
// });
