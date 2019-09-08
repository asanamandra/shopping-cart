//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
var encrypt = require('mongoose-encryption');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-allen:Scoobytwo2@cluster0-5gksb.mongodb.net/loginDB", {useNewUrlParser: true});

const userSchema = new mongoose.Schema({
  email:{
    type: String,
    required: [true]
  },
  name: {
    type: String,
    required: [true]
  },
  password: {
    type: String,
    required: [true]
  }
});

const secret = "Thisistheencryptionsecret.";
userSchema.plugin(encrypt, {secret: secret, encryptedFields: ['password'] });
// userSchema.plugin(encrypt, { encryptionKey: secret, signingKey: sigKey, excludeFromEncryption: ['age'] });


const User = new mongoose.model("User", userSchema);

app.route("/")
.get(function(req,res){
  res.render("login");
})
.post(function(req,res){

  const email = req.body.email;
  const password = req.body.password;
  User.count({email: req.body.email},function(err,count){
      if(count>0)
      {
        User.findOne({email:email}, function(err, foundUser){
          if(err){
            console.log(err);
          }
          else{
            if(foundUser){
              if(foundUser.password === password){
                res.render("welcome");
              }
              else{
                res.render("errors",{message:"Password Incorrect"});
              }
            }
          }
        });
      }
      else{
        res.render("errors",{message: "Could not find email"});
      }

});
});

app.route("/signup")
.get(function(req,res){
  res.render("signup");
})
.post(function(req,res){
  User.count({email: req.body.email},function(err,count){
      if(count>0)
      {
        res.render("errors",{message:"Email already in use"});

      }
      else{
        const newUser = new User({
          email: req.body.email,
          name: req.body.name,
          password: req.body.password
        });
        newUser.save(function(err){

          if(!err){
            res.render("login");
          }
          else{
            console.log(err);
          }
        });
        }
});
});
app.route("/users")
.get(function(req,res){

  User.find({}, function(err, foundUsers){

    if(!err){

      var returnArr = [];
      foundUsers.forEach(function(user){
        const email = user.email;
        const name = user.name;
        var obj = {
          email: email,
          name: name
        };
        returnArr.push(obj);
      });
      var jsonUsers =  JSON.stringify(returnArr);
      // console.log(jsonUsers);
      res.send(jsonUsers);

    }
    else{
        console.log(err);
      res.send(err);
    }
  });
})
.post(function(req,res){
  // User.count({email: requestedEmail}, function (err, count){
  //   if(count>0){
  //       //document exists });

User.count({email: req.body.email},function(err,count){
    if(count>0){
      res.send("User already exists");
    }
    else{
      const newUser = new User({
        email: req.body.email,
        name: req.body.name,
        password: req.body.password
      });
      newUser.save(function(err){

        if(!err){
          res.send("saved user successfully");
        }
        else{
          res.send(err);
        }
      });
    }
});
})
.delete(function(req,res){
  User.deleteMany({}, function(err){
    if(!err){
      res.send("successfully deleted all users");
    }
    else{
      res.send(err);
    }
  });
});
app.route("/users/:userEmail")
.get(function(req, res){
  const requestedEmail = req.params.userEmail;
  User.count({email: requestedEmail}, function (err, count){
    if(count>0){
        //document exists });

        User.findOne({email:requestedEmail}, function(err,user){
          if(!err){
            var returnArr = [];
              const email = user.email;
              const name = user.name;
              var obj = {
                email: email,
                name: name
              };
              returnArr.push(obj);
            var jsonUsers =  JSON.stringify(returnArr);
            // console.log(jsonUsers);
            res.send(jsonUsers);
          }
          else{
            res.send(err);
          }
        });
    }
    else{
      res.send("User does not exist");
    }
});
})
.put(function(req,res){
  const requestedEmail = req.params.userEmail;
  User.count({email: requestedEmail}, function (err, count)
  {
    if(count>0)
    {
      User.update(
        {email: requestedEmail},
        {email: req.body.email, name: req.body.name, password: req.body.password},
        {overwrite: true},
        function(err){
          if(!err){
            res.send("Successfully updated article");
          }
          else{
            res.send(err);
          }
        }
      );
    }
    else
    {
      res.send("Email does not exist");
    }
  });
})
.patch(function(req,res){
  const requestedEmail = req.params.userEmail;
  User.count({email: requestedEmail}, function (err, count)
  {
    if(count>0)
    {
      User.update(
        {email: requestedEmail},
        {$set: req.body},
        {runValidators:true},
        function(err){
          if(!err){
            res.send("successfully updated patch");
          }
          else{
            res.send(err);
          }
        }
      );

    }
    else{
      res.send("Email does not exist");
    }
  }
);
})
.delete(function(req,res){
  const requestedEmail = req.params.userEmail;
  User.count({email: requestedEmail}, function (err, count)
  {
    if(count>0)
    {
      User.deleteOne(
        {email: requestedEmail},
        function(err){
          if(!err){
            res.send("successfully deleted");
          }
          else{
            res.send(err);
          }
        }
      );
    }
    else{
      res.send("Email does not exist");
    }
});
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
// app.listen(port);

app.listen(port, function(){
  console.log("server started successfully");
});
