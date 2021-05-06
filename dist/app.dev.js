"use strict";

require('dotenv').config();

var _require = require('googleapis'),
    google = _require.google;

var path = require('path');

var fs = require('fs');

var _require2 = require('googleapis/build/src/apis/abusiveexperiencereport'),
    auth = _require2.auth;

var express = require('express');

var jwt = require('jsonwebtoken');

var cookieParser = require('cookie-parser'); // const app = express('express');


var bodyparser = require("body-parser");

var upload = require('express-fileupload');

var app = express();

var alert = require('alert');

var sha256 = require('sha256');

var ejs = require('ejs');

var mongoose = require('mongoose');

var _require3 = require('./books'),
    forEach = _require3.forEach;

var nodemailer = require('nodemailer');

app.use(bodyparser.urlencoded({
  extended: true
}));
app.use(express["static"]("public"));
app.use(upload());
app.use(cookieParser());
app.set('view engine', 'ejs');
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'wcespace1947@gmail.com',
    pass: 'WCESpace@150401'
  }
}); // booksname

var filename;
var filename1;
var fille1id;
var file2id; // connecting database to url
// mongoose.connect("mongodb+srv://admin-wcespace:WCESpace150401@cluster0.5htuy.mongodb.net/User",{useUnifiedTopology: true,useNewUrlParser: true});

mongoose.connect("mongodb://admin-wcespace:WCESpace150401@cluster0-shard-00-00.5htuy.mongodb.net:27017,cluster0-shard-00-01.5htuy.mongodb.net:27017,cluster0-shard-00-02.5htuy.mongodb.net:27017/User?ssl=true&replicaSet=atlas-rps98p-shard-0&authSource=admin&retryWrites=true&w=majority", {
  useUnifiedTopology: true,
  useNewUrlParser: true
}); // mongoose.connect('mongodb://localhost:27017/User',{ useUnifiedTopology: true , useNewUrlParser: true});

var userSchema = new mongoose.Schema({
  email: String,
  username: String,
  password: String,
  admin: Number,
  shelf: [],
  tokens: [{
    token: String
  }]
});
var otpSchema = new mongoose.Schema({
  email: String,
  otp: Number
}); // Generating Tokens

userSchema.methods.generateAuthToken = function (req, res) {
  try {
    var token = jwt.sign({
      _id: this._id
    }, process.env.SECRET_KEY);
    console.log(token);
    this.tokens = this.tokens.concat({
      token: token
    });
    this.save();
    return token;
  } catch (error) {
    console.log("Error Part :" + error);
  }
};

userSchema.methods.generateAuthTokenForLogin = function (req, res) {
  try {
    var token = jwt.sign({
      _id: this._id.toString()
    }, process.env.SECRET_KEY);
    this.save();
    return token;
  } catch (error) {
    console.log("Error Part :" + err);
  }
};

var User = mongoose.model("User", userSchema);
var Otp = mongoose.model("Otp", otpSchema); // contribute 

var CLIENT_ID = '382614871956-6pecnaqrkthd4qac7nqm7spg037irfcd.apps.googleusercontent.com';
var CLIENT_SECRENT = 'nnqLnJLHUkFI9Vhk6ShfvV4T';
var REDIRECT_URI = 'https://developers.google.com/oauthplayground';
var REFRESH_TOKEN = '1//04pnN0K-O79_cCgYIARAAGAQSNwF-L9IrQpRbqkcm4RqV8k_-kf7QiWr-S0ZZXuSsJVk14GT1LRa46ydBbRxvznVleXQTquKG228';
var oauth2client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRENT, REDIRECT_URI);
oauth2client.setCredentials({
  refresh_token: REFRESH_TOKEN
}); // google drive 

var drive = google.drive({
  version: 'v3',
  auth: oauth2client
});
var booksstore = {
  year: "",
  branch: "",
  bookname: "",
  author: "",
  subject: "",
  imagelink: "",
  booklink: ""
};
var isSigningUp = false;
var validated = false;
var isLogin = false; // This show which user is currently logged in

var curUser = {
  email: "",
  username: "",
  password: "",
  admin: 0,
  shelf: [],
  tokens: []
};
app.get('/home', function (req, res) {
  try {
    var token = req.cookies.jwt;
    var verifyUser = jwt.verify(token, process.env.SECRET_KEY);
    console.log(verifyUser);
    User.findById(verifyUser._id, function (err, doc) {
      res.render('Other/home', {
        curUser: doc
      });
    });
  } catch (error) {
    res.render('Other/home', {
      curUser: curUser
    });
  }
});

var authorize = function authorize(req, res, next) {
  try {
    var token = req.cookies.jwt;
    var verifyUser = jwt.verify(token, process.env.SECRET_KEY);
    console.log(verifyUser);
    User.findById(verifyUser._id, function (err, doc) {
      console.log(doc);
      req.token = token;
      req.user = doc;
      next();
    });
  } catch (error) {
    console.log("1    " + error);
  }
};

app.get('/logout', authorize, function (req, res) {
  try {
    res.clearCookie('jwt');
    console.log("Logout");
    req.user.save();
    res.redirect('/home');
  } catch (error) {
    console.log("2      " + error);
  }
});
app.get('/', function (req, res) {
  try {
    var token = req.cookies.jwt;
    var verifyUser = jwt.verify(token, process.env.SECRET_KEY);
    console.log(verifyUser);
    User.findById(verifyUser._id, function (err, doc) {
      res.redirect('/home');
    });
  } catch (error) {
    res.render('login/index');
  }
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
      res.redirect('/');
    } else {
      if (doc) {
        var token = doc.generateAuthTokenForLogin();
        res.cookie("jwt", token, {
          expires: new Date(Date.now() + 1800000),
          httpOnly: true
        });
        res.redirect('/home');
      } else {
        alert("Invalid Credentials");
        res.redirect('/');
      }
    }
  });
});
app.get('/signup', function (req, res) {
  if (isLogin) res.redirect('/');else res.render('login/signup');
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
        isSigningUp = false;
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
              var newOTP = new Otp({
                email: curMail,
                otp: randNumber
              });
              newOTP.save();
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
  if (isSigningUp) res.render('login/otp');else res.redirect('/');
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
      // console.log("error Otp validation");
      res.redirect("/");
    } else {
      if (doc) {
        Otp.deleteOne({
          email: curMail,
          otp: req.body.otp
        }, function (error) {
          if (!error) {
            validated = true;
            res.redirect('/info');
          }
        });
      } else {
        alert("Invalid OTP");
        res.redirect('/otp');
      }
    }
  });
});
app.get('/info', function (req, res) {
  if (isSigningUp && validated && !isLogin) {
    isSigningUp = false;
    validated = false;
    res.render('login/info');
  } else res.redirect('/');
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
        alert("This username already exists");
        res.redirect('/');
      } else {
        try {
          var newUser = new User({
            email: curMail,
            username: curUsername,
            password: curPassword,
            admin: 0,
            shelf: []
          });
          var token = newUser.generateAuthToken();
          res.cookie("jwt", token, {
            expires: new Date(Date.now() + 1800000),
            httpOnly: true
          });
          newUser.save();
          console.log("Success Part: " + newUser);
          res.redirect('/');
        } catch (error) {
          console.log(error);
        }
      }
    }
  });
});
app.get('/forget', function (req, res) {
  if (!isLogin) res.render('login/forget');else res.redirect('/');
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
  try {
    var token = req.cookies.jwt;
    var verifyUser = jwt.verify(token, process.env.SECRET_KEY);
    console.log(verifyUser);
    User.findById(verifyUser._id, function (err, doc) {
      res.render('login/cpass');
    });
  } catch (error) {
    res.redirect('/');
  }
});
app.post('/cpass', function (req, res) {
  var curPassword = sha256(req.body.cur_pass);
  var newPassword = sha256(req.body.new_pass);
  console.log(newPassword);
  console.log(curUser);

  try {
    var token = req.cookies.jwt;
    var verifyUser = jwt.verify(token, process.env.SECRET_KEY);
    console.log(verifyUser);
    User.findById(verifyUser._id, function (err, curUser) {
      if (err) console.log("Error");else {
        if (curUser) {
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
  } catch (error) {
    res.redirect('/');
  }

  User.findOne({
    $and: [{
      username: curUser.username
    }, {
      password: curPassword
    }]
  }, function (err, doc) {});
}); // other route 
// CSE books

var CSEschema = new mongoose.Schema({
  year: String,
  bookname: String,
  author: String,
  subject: String,
  imgUrl: String,
  bookUrl: String
}); // IT books

var ITschema = new mongoose.Schema({
  year: String,
  bookname: String,
  author: String,
  subject: String,
  imgUrl: String,
  bookUrl: String
}); // ELE books

var ELEschema = new mongoose.Schema({
  year: String,
  bookname: String,
  author: String,
  subject: String,
  imgUrl: String,
  bookUrl: String
}); // ELET books

var ELETschema = new mongoose.Schema({
  year: String,
  bookname: String,
  author: String,
  subject: String,
  imgUrl: String,
  bookUrl: String
}); // MECH books

var MECHschema = new mongoose.Schema({
  year: String,
  bookname: String,
  author: String,
  subject: String,
  imgUrl: String,
  bookUrl: String
}); // CIVIL books

var CIVILschema = new mongoose.Schema({
  year: String,
  bookname: String,
  author: String,
  subject: String,
  imgUrl: String,
  bookUrl: String
});
var CSE = mongoose.model("CSE", CSEschema);
var IT = mongoose.model("IT", ITschema);
var ELE = mongoose.model("ELE", ELEschema);
var ELET = mongoose.model("ELET", ELETschema);
var MECH = mongoose.model("MECH", MECHschema);
var CIVIL = mongoose.model("CIVIL", CIVILschema);
var sampleCSE = new CSE({
  year: 'fy',
  bookname: "Python",
  author: "Pavan Shinde",
  subject: "Coding",
  imgUrl: 'https://media.newstracklive.com/uploads/sports-news/cricket/Aug/14/big_thumb/msd2_5f3609e79d303.jpg',
  bookUrl: 'https://drive.google.com/file/d/1hxhUvb1FZW8dXgbIcF8JDPWAajkhuTVE/view?usp=sharing'
}); // sampleCSE.save();
// file to upload in google drive 

var filepath = path.join(__dirname, 'dc.png');

function generatePublicurl(fileid, filedata) {
  try {
    var fileId = fileid;
    drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });
    var result = drive.files.get({
      fileId: fileId,
      fields: 'webViewLink, webContentLink'
    }); // console.log(result.data);

    if (filedata === 'myFile1') {
      booksstore.booklink = result.data.webViewLink;
      Promise.all(result.data.webViewLink).then(function () {
        booksstore.booklink = result.data.webViewLink;
      })["catch"](console.error);
    }

    if (filedata === 'myFile2') {
      booksstore.imagelink = 'https://drive.google.com/uc?export=view&id=' + fileId; // console.log(sampleCSE.imgUrl);

      Promise.all(booksstore.imagelink).then(function () {
        Promise.all(booksstore.booklink).then(function () {
          alert('data successfully saved. Thank You For contributing Us......');
          var path = './public/books/' + filename;
          var path1 = './public/books/' + filename1;

          try {
            fs.unlinkSync(path);
            fs.unlinkSync(path1); // console.log("File Deleted ")
            //file removed
          } catch (err) {
            console.error(err);
          }
        })["catch"](console.error);
      })["catch"](console.error);
    } // else 
    // console.log("Somthing is Wrong");
    // console.log(booksstore);

  } catch (error) {
    console.log(error.message);
  }
} // To upload file 
// to upload file in google drive => function 
// below function is a  function 


function uploadFile(mimetype, bookname, filedata) {
  var bookname1 = 'dcbook.pdf'; // console.log(bookname,bookname1);

  try {
    var response = drive.files.create({
      requestBody: {
        name: bookname,
        mimeType: mimetype
      },
      media: {
        mimeType: mimetype,
        body: fs.createReadStream('./public/books/' + bookname)
      }
    });
    var promises = response.data.id;
    if (filedata === 'myFile1') fille1id = response.data.id;
    if (filedata === 'myFile2') file2id = response.data.id; // console.log(response.data.id);

    Promise.all(promises).then(function () {
      generatePublicurl(response.data.id, filedata);
      console.log('File uploaded in drive creating link wait....');
    })["catch"](console.error);
  } catch (error) {
    console.error(error.message);
  }
} // uploadFile();


function intervalFunc() {
  console.log('Wait');
} // to delete file from google drive 


function deletefilr(fileid) {
  try {
    var response = drive.files["delete"]({
      fileId: fileid
    });
    console.log(response.data, response.status);
  } catch (error) {
    console.log("error.message");
  }
} // deletefilr();


app.get("/contribute", function (req, res) {
  try {
    var token = req.cookies.jwt;
    var verifyUser = jwt.verify(token, process.env.SECRET_KEY);
    console.log(verifyUser);
    User.findById(verifyUser._id, function (err, doc) {
      if (!err) {
        if (doc.admin === 1) {
          res.render("Other/contribute", {
            curUser: doc
          });
        } else res.redirect('/');
      }
    });
  } catch (error) {
    res.redirect('/');
  }
});
app.post('/contribute', function (req, res) {
  dir = './public/books'; // if (!fs.existsSync(dir)){
  //     fs.mkdirSync(dir);
  // } else {
  //     fs.rmdirSync(dir, { recursive: true });
  //     fs.mkdirSync(dir);
  // }

  booksstore.branch = req.body.branch;
  booksstore.year = req.body.year;
  booksstore.bookname = req.body.bookname;
  booksstore.author = req.body.author;
  booksstore.subject = req.body.subject;

  if (req.files) {
    // console.log(req.files);
    var file = req.files.myFile1;
    filename = file.name;
    file.mv('./public/books/' + filename, function (err) {
      if (err) {
        console.log(err);
      } else {
        // console.log("File Uploaded ");
        var waitTill = new Date(new Date().getTime() + 20000);

        while (waitTill > new Date()) {}

        ;
        viewLinkbook = uploadFile(file.mimetype, filename, 'myFile1');

        while (waitTill > new Date()) {}

        ;
      }
    });
    var waitTill = new Date(new Date().getTime() + 3 * file.size / 1000000); // setInterval(intervalFunc, 10000);

    while (waitTill > new Date()) {}

    if (req.files.myFile2) {
      var file = req.files.myFile2;
      filename1 = file.name;
      file.mv('./public/books/' + filename1, function (err) {
        if (err) {
          console.log(err);
        } else {
          // console.log("File Uploaded ");
          waitTill = new Date(new Date().getTime() + 30000);

          while (waitTill > new Date()) {}

          viewLinkimage = uploadFile(file.mimetype, filename1, 'myFile2');

          while (waitTill > new Date()) {}

          ;
        }
      });
    } else {
      fileid = '1-yxOyT4sOXSI1d-urXz9hYKhTyXPmpcm';
      waitTill = new Date(new Date().getTime() + 30000);

      while (waitTill > new Date()) {}

      generatePublicurl(fileid, 'myFile2');
      booksstore.imgUrl = 'https://drive.google.com/uc?export=view&id=1-yxOyT4sOXSI1d-urXz9hYKhTyXPmpcm';
    }
  }

  var waitTill = new Date(new Date().getTime() + 3 * file.size / 1000000);

  while (waitTill > new Date()) {}

  res.redirect("/save"); // console.log(filename+" File Uploaded "); 
  // console.log(filename1+" File Uploaded "); 
  // console.log(file);
}); ///////////////////////////////////////////////

app.get("/save", function (req, res) {
  try {
    var token = req.cookies.jwt;
    var verifyUser = jwt.verify(token, process.env.SECRET_KEY);
    console.log(verifyUser);
    User.findById(verifyUser._id, function (err, doc) {
      if (!err) {
        if (doc.admin === 1) {
          res.render("Other/save", {
            curUser: doc,
            booksstore: booksstore
          });
        } else res.redirect('/');
      }
    });
  } catch (error) {
    res.redirect('/');
  }
});
app.post("/save", function (req, res) {
  if (booksstore.branch === "CSE") {
    sampleCSE = new CSE({
      year: booksstore.year,
      bookname: booksstore.bookname,
      author: booksstore.author,
      subject: booksstore.subject,
      imgUrl: booksstore.imagelink,
      bookUrl: booksstore.booklink
    });
    sampleCSE.save();
  } else {
    if (booksstore.branch === "IT") {
      sampleCSE = new IT({
        year: booksstore.year,
        bookname: booksstore.bookname,
        author: booksstore.author,
        subject: booksstore.subject,
        imgUrl: booksstore.imagelink,
        bookUrl: booksstore.booklink
      });
      sampleCSE.save();
    } else {
      if (booksstore.branch === "CIVIL") {
        sampleCSE = new CIVIL({
          year: booksstore.year,
          bookname: booksstore.bookname,
          author: booksstore.author,
          subject: booksstore.subject,
          imgUrl: booksstore.imagelink,
          bookUrl: booksstore.booklink
        });
        sampleCSE.save();
      } else {
        if (booksstore.branch === "MECH") {
          sampleCSE = new MECH({
            year: booksstore.year,
            bookname: booksstore.bookname,
            author: booksstore.author,
            subject: booksstore.subject,
            imgUrl: booksstore.imagelink,
            bookUrl: booksstore.booklink
          });
          sampleCSE.save();
        } else {
          if (booksstore.branch === "ELE") {
            sampleCSE = new ELE({
              year: booksstore.year,
              bookname: booksstore.bookname,
              author: booksstore.author,
              subject: booksstore.subject,
              imgUrl: booksstore.imagelink,
              bookUrl: booksstore.booklink
            });
            sampleCSE.save();
          } else {
            if (booksstore.branch === "ELET") {
              sampleCSE = new ELET({
                year: booksstore.year,
                bookname: booksstore.bookname,
                author: booksstore.author,
                subject: booksstore.subject,
                imgUrl: booksstore.imagelink,
                bookUrl: booksstore.booklink
              });
              sampleCSE.save();
            } else {
              alert("You didn't selected any branch Please Try again!!!");
              deletefilr(fille1id);
              deletefilr(file2id);
            }
          }
        }
      }
    }
  }

  res.redirect("/contribute");
}); ////////////////////////////////////////////

app.get("/resources", function (req, res) {
  try {
    var token = req.cookies.jwt;
    var verifyUser = jwt.verify(token, process.env.SECRET_KEY);
    console.log(verifyUser);
    User.findById(verifyUser._id, function (err, doc) {
      if (!err) {
        res.render("Other/resources", {
          curUser: doc
        });
      }
    });
  } catch (error) {
    res.redirect('/');
  }
});
app.get("/resources/:yrbr", function (req, res) {
  try {
    var token = req.cookies.jwt;
    var verifyUser = jwt.verify(token, process.env.SECRET_KEY);
    console.log(verifyUser);
    User.findById(verifyUser._id, function (err, curUser) {
      if (!err) {
        var yrbr = req.params.yrbr; // CSE

        if (yrbr === 'fycse') {
          CSE.find({
            year: 'fy'
          }, function (err, doc) {
            if (!err) {
              if (doc) {
                res.render('Other/books', {
                  curUser: curUser,
                  bookinfo: doc,
                  yrbr: yrbr
                });
              }
            }
          });
        }

        if (yrbr === 'sycse') {
          CSE.find({
            year: 'sy'
          }, function (err, doc) {
            if (!err) {
              if (doc) {
                res.render('Other/books', {
                  curUser: curUser,
                  bookinfo: doc,
                  yrbr: yrbr
                });
              }
            }
          });
        }

        if (yrbr === 'tycse') {
          CSE.find({
            year: 'ty'
          }, function (err, doc) {
            if (!err) {
              if (doc) {
                res.render('Other/books', {
                  curUser: curUser,
                  bookinfo: doc,
                  yrbr: yrbr
                });
              }
            }
          });
        }

        if (yrbr === 'btechcse') {
          CSE.find({
            year: 'btech'
          }, function (err, doc) {
            if (!err) {
              if (doc) {
                res.render('Other/books', {
                  curUser: curUser,
                  bookinfo: doc,
                  yrbr: yrbr
                });
              }
            }
          });
        } // IT


        if (yrbr === 'fyit') {
          IT.find({
            year: 'fy'
          }, function (err, doc) {
            if (!err) {
              if (doc) {
                res.render('Other/books', {
                  curUser: curUser,
                  bookinfo: doc,
                  yrbr: yrbr
                });
              }
            }
          });
        }

        if (yrbr === 'syit') {
          IT.find({
            year: 'sy'
          }, function (err, doc) {
            if (!err) {
              if (doc) {
                res.render('Other/books', {
                  curUser: curUser,
                  bookinfo: doc
                });
              }
            }
          });
        }

        if (yrbr === 'tyit') {
          IT.find({
            year: 'ty'
          }, function (err, doc) {
            if (!err) {
              if (doc) {
                res.render('Other/books', {
                  curUser: curUser,
                  bookinfo: doc,
                  yrbr: yrbr
                });
              }
            }
          });
        }

        if (yrbr === 'btechit') {
          IT.find({
            year: 'btech'
          }, function (err, doc) {
            if (!err) {
              if (doc) {
                res.render('Other/books', {
                  curUser: curUser,
                  bookinfo: doc,
                  yrbr: yrbr
                });
              }
            }
          });
        } // ELE


        if (yrbr === 'fyele') {
          ELE.find({
            year: 'fy'
          }, function (err, doc) {
            if (!err) {
              if (doc) {
                res.render('Other/books', {
                  curUser: curUser,
                  bookinfo: doc,
                  yrbr: yrbr
                });
              }
            }
          });
        }

        if (yrbr === 'syele') {
          ELE.find({
            year: 'sy'
          }, function (err, doc) {
            if (!err) {
              if (doc) {
                res.render('Other/books', {
                  curUser: curUser,
                  bookinfo: doc
                });
              }
            }
          });
        }

        if (yrbr === 'tyele') {
          ELE.find({
            year: 'ty'
          }, function (err, doc) {
            if (!err) {
              if (doc) {
                res.render('Other/books', {
                  curUser: curUser,
                  bookinfo: doc,
                  yrbr: yrbr
                });
              }
            }
          });
        }

        if (yrbr === 'btechele') {
          ELE.find({
            year: 'btech'
          }, function (err, doc) {
            if (!err) {
              if (doc) {
                res.render('Other/books', {
                  curUser: curUser,
                  bookinfo: doc,
                  yrbr: yrbr
                });
              }
            }
          });
        } // ELET


        if (yrbr === 'fyelet') {
          ELET.find({
            year: 'fy'
          }, function (err, doc) {
            if (!err) {
              if (doc) {
                res.render('Other/books', {
                  curUser: curUser,
                  bookinfo: doc,
                  yrbr: yrbr
                });
              }
            }
          });
        }

        if (yrbr === 'syelet') {
          ELET.find({
            year: 'sy'
          }, function (err, doc) {
            if (!err) {
              if (doc) {
                res.render('Other/books', {
                  curUser: curUser,
                  bookinfo: doc
                });
              }
            }
          });
        }

        if (yrbr === 'tyelet') {
          ELET.find({
            year: 'ty'
          }, function (err, doc) {
            if (!err) {
              if (doc) {
                res.render('Other/books', {
                  curUser: curUser,
                  bookinfo: doc,
                  yrbr: yrbr
                });
              }
            }
          });
        }

        if (yrbr === 'btechelet') {
          ELET.find({
            year: 'btech'
          }, function (err, doc) {
            if (!err) {
              if (doc) {
                res.render('Other/books', {
                  curUser: curUser,
                  bookinfo: doc,
                  yrbr: yrbr
                });
              }
            }
          });
        } // MECH


        if (yrbr === 'fymech') {
          MECH.find({
            year: 'fy'
          }, function (err, doc) {
            if (!err) {
              if (doc) {
                res.render('Other/books', {
                  curUser: curUser,
                  bookinfo: doc,
                  yrbr: yrbr
                });
              }
            }
          });
        }

        if (yrbr === 'symech') {
          MECH.find({
            year: 'sy'
          }, function (err, doc) {
            if (!err) {
              807969029;

              if (doc) {
                res.render('Other/books', {
                  curUser: curUser,
                  bookinfo: doc
                });
              }
            }
          });
        }

        if (yrbr === 'tymech') {
          MECH.find({
            year: 'ty'
          }, function (err, doc) {
            if (!err) {
              if (doc) {
                res.render('Other/books', {
                  curUser: curUser,
                  bookinfo: doc,
                  yrbr: yrbr
                });
              }
            }
          });
        }

        if (yrbr === 'btechmech') {
          MECH.find({
            year: 'btech'
          }, function (err, doc) {
            if (!err) {
              if (doc) {
                res.render('Other/books', {
                  curUser: curUser,
                  bookinfo: doc,
                  yrbr: yrbr
                });
              }
            }
          });
        } // CIVIL


        if (yrbr === 'fycivil') {
          CIVIL.find({
            year: 'fy'
          }, function (err, doc) {
            if (!err) {
              if (doc) {
                res.render('Other/books', {
                  curUser: curUser,
                  bookinfo: doc,
                  yrbr: yrbr
                });
              }
            }
          });
        }

        if (yrbr === 'sycivil') {
          CIVIL.find({
            year: 'sy'
          }, function (err, doc) {
            if (!err) {
              if (doc) {
                res.render('Other/books', {
                  curUser: curUser,
                  bookinfo: doc
                });
              }
            }
          });
        }

        if (yrbr === 'tycivil') {
          CIVIL.find({
            year: 'ty'
          }, function (err, doc) {
            if (!err) {
              if (doc) {
                res.render('Other/books', {
                  curUser: curUser,
                  bookinfo: doc,
                  yrbr: yrbr
                });
              }
            }
          });
        }

        if (yrbr === 'btechcivil') {
          CIVIL.find({
            year: 'btech'
          }, function (err, doc) {
            if (!err) {
              if (doc) {
                res.render('Other/books', {
                  curUser: curUser,
                  bookinfo: doc,
                  yrbr: yrbr
                });
              }
            }
          });
        }
      }
    });
  } catch (error) {
    res.redirect('/');
  }

  if (isLogin) {}
});
app.post("/resources/:yrbr", function (req, res) {
  var yrbr = req.params.yrbr;
  var wishyrbr = req.body.wish_yrbr;
  var wishId = req.body.id;
  var wishyear = req.body.year;
  var list = {
    year: wishyear,
    id: wishId
  };
  var x = CSE;
  console.log(yrbr);

  try {
    var token = req.cookies.jwt;
    var verifyUser = jwt.verify(token, process.env.SECRET_KEY);
    console.log(verifyUser);
    User.findById(verifyUser._id, function (err, curUser) {
      CSE.findOne({
        $and: [{
          year: list.year
        }, {
          _id: list.id
        }]
      }, function (err, doc) {
        if (!err && doc) {
          var _curShelf = [];
          User.findOne({
            username: curUser.username
          }, function (err, result) {
            if (!err) {
              _curShelf = result.shelf;
              var i = 0;

              for (i = 0; i < _curShelf.length; i++) {
                if (JSON.stringify(_curShelf[i]) === JSON.stringify(doc)) {
                  break;
                }
              } // console.log(curShelf.length+" "+i);
              // Book not in shelf


              if (i === _curShelf.length) {
                _curShelf.push(doc);
              } // Book is in shelf
              else {
                  _curShelf.splice(i, 1);
                }

              User.updateOne({
                username: curUser.username
              }, {
                shelf: _curShelf
              }, function (err) {
                if (!err) {
                  // console.log("Shelf Updated Successfully");
                  res.redirect("/resources/" + yrbr);
                }
              });
              User.findOne({
                username: curUser.username
              }, function (err, doc) {
                if (!err) curUser = doc;
              });
            }
          });
        }
      });
      IT.findOne({
        $and: [{
          year: list.year
        }, {
          _id: list.id
        }]
      }, function (err, doc) {
        if (!err && doc) {
          var _curShelf2 = [];
          User.findOne({
            username: curUser.username
          }, function (err, result) {
            if (!err) {
              _curShelf2 = result.shelf;
              var i = 0;

              for (i = 0; i < _curShelf2.length; i++) {
                if (JSON.stringify(_curShelf2[i]) === JSON.stringify(doc)) {
                  break;
                }
              }

              console.log(_curShelf2.length + " " + i); // Book not in shelf

              if (i === _curShelf2.length) {
                _curShelf2.push(doc);
              } // Book is in shelf
              else {
                  _curShelf2.splice(i, 1);
                }

              User.updateOne({
                username: curUser.username
              }, {
                shelf: _curShelf2
              }, function (err) {
                if (!err) {
                  console.log("Shelf Updated Successfully");
                  res.redirect("/resources/" + yrbr);
                }
              });
              User.findOne({
                username: curUser.username
              }, function (err, doc) {
                if (!err) curUser = doc;
              });
            }
          });
        }
      });
    });
  } catch (error) {
    res.redirect('/');
  }
});
app.get('/shelf', function (req, res) {
  try {
    var token = req.cookies.jwt;
    var verifyUser = jwt.verify(token, process.env.SECRET_KEY);
    console.log(verifyUser);
    User.findById(verifyUser._id, function (err, doc) {
      if (!err) {
        if (!err) {
          curShelf = doc.shelf;
          console.log(curUser.shelf.length);
        }

        res.render('Other/shelf', {
          bookinfo: curShelf,
          curUser: doc
        });
      }
    });
  } catch (error) {
    res.redirect('/');
  }
});
app.listen(5000, function () {
  console.log("server is running on port 5000");
});