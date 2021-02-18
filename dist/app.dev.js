"use strict";

var express = require('express');

var app = express('express');

var BodyParser = require('body-parser'); // added trial books.js file for testing of books.ejs file using array of key value pair see in books.js file 


var books = require("./books");

var alert = require('alert');

var sha256 = require('sha256'); // sending varification mail


var nodemailer = require('nodemailer'); // Author


var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'wcespace1947@gmail.com',
    pass: 'WCESpace@150401'
  }
}); // requiring

var mongoose = require('mongoose'); // connecting database to url


mongoose.connect("mongodb://localhost:27017/User", {
  useUnifiedTopology: true,
  useNewUrlParser: true
}); // Creating schema
// for users

var userSchema = new mongoose.Schema({
  email: String,
  username: String,
  password: String,
  admin: Number,
  shelf: [String]
}); // for otps

var otpSchema = new mongoose.Schema({
  email: String,
  otp: Number
});
var samplePassword = "pavan";
samplePassword = sha256(samplePassword); // console.log(samplePassword);
// creating model
// for users

var User = mongoose.model("User", userSchema); // for otp

var Otp = mongoose.model("Otp", otpSchema);
var sampleUser = new User({
  email: "pavan.shinde@walchandsangli.ac.in",
  username: "pavanshinde7494",
  password: samplePassword
});
var sampleOtp = new Otp({
  email: "pavan.shinde@walchandsangli.ac.in",
  otp: 7777
}); // sampleOtp.save();

app.use(BodyParser.urlencoded({
  extended: true
}));
app.use(express["static"]("public"));
app.set('view engine', 'ejs');
var isSigningUp = false;
var validated = false;
var isLogin = false; // This show which user is currently logged in

var curUser = {
  email: "",
  username: "",
  password: "",
  admin: 0,
  shelf: []
};
app.get('/home', function (req, res) {
  res.render('Other/home', {
    curUser: curUser
  });
});
app.get('/logout', function (req, res) {
  isLogin = false;
  curUser = {
    email: "",
    username: "",
    password: "",
    admin: 0,
    shelf: []
  };
  res.redirect('/home');
});
app.get('/', function (req, res) {
  if (isLogin) res.redirect('/home');else res.render('login/index');
});
app.post('/', function (req, res) {
  var _ref = [req.body.username, sha256(req.body.pass)],
      tempUserName = _ref[0],
      tempPassword = _ref[1]; // console.log(tempUserName+" " + tempPassword);

  User.findOne({
    $and: [{
      username: tempUserName
    }, {
      password: tempPassword
    }]
  }, function (err, doc) {
    if (err) {
      console.log("There might be some error");
      res.redirect('/login');
    } else {
      if (doc) {
        curUser = doc;
        isLogin = true;
        res.redirect('/home');
      } else {
        alert("Invalid Credentials");
        res.redirect('/');
      }
    }
  });
});
app.get('/signup', function (req, res) {
  res.render('login/signup', {
    fname: "Pavan",
    lname: "Shinde"
  });
});
var curMail;
app.post('/signup', function (req, res) {
  isSigningUp = true;
  var randNumber = Math.floor(Math.random() * 10000); // console.log(randNumber);

  curMail = req.body.fname.toLowerCase() + "." + req.body.lname.toLowerCase() + "@walchandsangli.ac.in";
  User.findOne({
    email: curMail
  }, function (err, doc) {
    if (err) console.log("There might be some error in finding email");else {
      if (doc) {
        alert("Already Have an account");
        res.redirect('/signup');
      } else {
        Otp.findOne({
          email: curMail
        }, function (error, result) {
          if (error) console.log("There might be some problem in getting email");else {
            if (result) {
              Otp.updateOne({
                email: curMail
              }, {
                otp: randNumber
              }, function (err, doc) {
                if (err) console.log("error in updation");
              });
            } else {
              Otp.insertMany([{
                email: curMail,
                otp: randNumber
              }], function (err, doc) {
                if (err) console.log("There might be some problem in inserting mail");
              });
            } // sending varification mail


            var FirstName = req.body.fname.charAt(0).toUpperCase() + req.body.fname.slice(1).toLowerCase();
            var LastName = req.body.lname.charAt(0).toUpperCase() + req.body.lname.slice(1).toLowerCase();
            var mailText = " Dear " + FirstName + " " + LastName + "\nThank you for showing your interest in WCE SPACE." + "\nYour varification OTP for signing up in WCE SPACE is " + randNumber + "\nThanks and Regards," + "\nPlease do not reply to this e-mail," + "this is a system generated email sent from an unattended mail box.";
            var mailOptions = {
              from: "wcespace1947@gmail.com",
              to: curMail,
              subject: 'Email Varification for WCE SPACE sign up',
              text: mailText
            };
            transporter.sendMail(mailOptions, function (error, info) {
              if (error) {
                console.log(error);
              } else {
                console.log('Email sent: ' + info.response);
              }
            });
          }
        });
        res.redirect('/otp');
      }
    }
  });
});
app.get('/otp', function (req, res) {
  if (isSigningUp) res.render('login/otp');else res.send("Fuck Off");
});
app.post('/otp', function (req, res) {
  Otp.findOne({
    $and: [{
      email: curMail
    }, {
      otp: req.body.otp
    }]
  }, function (err, doc) {
    if (err) {
      console.log("error Otp validation");
      res.redirect("/");
    } else {
      if (doc) {
        Otp.deleteOne({
          email: curMail,
          otp: req.body.otp
        }, function (error) {
          if (error) console.log("error in deletion otp");else {
            validated = true;
            res.redirect('/info');
          }
        });
      } else {
        res.send("Invalid Otp");
      }
    }
  });
});
app.get('/info', function (req, res) {
  if (isSigningUp && validated && !isLogin) {
    isSigningUp = false;
    validated = false;
    res.render('login/info');
  } else res.send("Fuck Off");
});
app.post('/info', function (req, res) {
  var curPassword = sha256(req.body.pass);
  var curUsername = req.body.username;
  User.findOne({
    username: curUsername
  }, function (err, doc) {
    if (err) {
      console.log("error in searching username");
    } else {
      if (doc) {
        res.send("Already have an account");
      } else {
        User.insertMany([{
          email: curMail,
          password: curPassword,
          username: curUsername,
          admin: 0,
          shelf: []
        }], function (err) {
          if (err) console.log("Error in successful signup");else {
            alert('You have been signed up successfully');
            res.redirect('/');
          }
        });
      }
    }
  });
});
app.get('/forget', function (req, res) {
  res.render('login/forget');
});
app.post('/forget', function (req, res) {
  User.findOne({
    username: req.body.username
  }, function (err, doc) {
    if (err) console.log("Error in forget pass process");else {
      if (doc) {
        var randNumber = Math.floor(Math.random() * 1000000000);
        var tempMail = doc.email;
        console.log(sha256(String(randNumber)));
        User.updateOne({
          username: req.body.username
        }, {
          password: sha256(String(randNumber))
        }, function (error) {
          if (err) console.log("Error in updating");
        });
        console.log(tempMail);
        var mailOptions = {
          from: "wcespace1947@gmail.com",
          to: doc.email,
          subject: 'Change Password for WCE SPACE Account',
          text: "Hello " + doc.username + "\nYour Temporory password for WCE SPACE Log in is: " + String(randNumber) + "\nPlease Don't Share it with anyone and We recommand you to change it ,  When" + " You will log in using provided temporory password"
        };
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log("Sending mail");
          } else {
            console.log('Email sent: ' + info.response);
          }
        });
        alert('Mail has been sent to your Walchand Email ID');
        res.redirect('/');
      } else {
        alert("No such user is available");
        res.redirect('/forget');
      }
    }
  });
});
app.get('/cpass', function (req, res) {
  if (isLogin) res.render('login/cpass');else res.redirect('/');
});
app.post('/cpass', function (req, res) {
  var curPassword = sha256(req.body.cur_pass);
  var newPassword = sha256(req.body.new_pass);
  console.log(newPassword);
  console.log(curUser);
  User.findOne({
    $and: [{
      username: curUser.username
    }, {
      password: curPassword
    }]
  }, function (err, doc) {
    if (err) console.log("Error");else {
      if (doc) {
        User.updateOne({
          username: curUser.username
        }, {
          password: newPassword
        }, function (error) {
          if (error) console.log("Error in updating");
        });
        alert("Your Password Has been updated");
        res.redirect('/home');
      } else {
        alert("Please Enter Correct Current Password");
        res.redirect('/cpass');
      }
    }
  });
}); // other route 

app.get("/contribute", function (req, res) {
  res.render("Other/contribute", {
    curUser: curUser
  });
});
app.get("/resources", function (req, res) {
  res.render("Other/resources", {
    curUser: curUser
  });
});
app.get("/books", function (req, res) {
  res.render("Other/books", {
    curUser: curUser,
    bookinfo: books
  });
});
app.listen(3000, function () {
  console.log("server is running on port 3000");
});