// require('dotenv').config();
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const path = require('path');
const fs = require('fs');
// const { auth } = require('googleapis/build/src/apis/abusiveexperiencereport');
// const config = require('./Backend/config/config.json');
const mongodbutil = require('./Backend/config/database')
const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
// const app = express('express');
const bodyparser = require("body-parser");
const upload = require('express-fileupload');
const app = express();

// var alert = require('alert');
const sha256 = require('sha256');
const ejs = require('ejs');
const mongoose = require('mongoose');

// const { forEach } = require('./books');
const nodemail = require('nodemailer');
// const { resolve } = require('path');

app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(upload());
app.use(cookieParser());
app.set('view engine', 'ejs');

let emailid = process.env.email;
if (emailid == null || emailid == "") {
    emailid = config.email.emailid;
}
if (process.env.SECRET_KEY == null || process.env.SECRET_KEY == "") {
    process.env.SECRET_KEY = config.key;
}
let password = process.env.password;
if (password == null || password == "") {
    password = config.email.password;
}

let transporter = nodemail.createTransport({
    host: 'smtp.gmail.com',
    service: 'gmail',
    port: 465,
    secure: true,
    auth: {
        type: 'OAuth2',
        user: 'wcespace1947@gmail.com',
        clientId: '77209510481-bl5aua8mgq1j86ahrr596qblqgr6mpb1.apps.googleusercontent.com',
        clientSecret: 'VZVjdR-gXIYDd1AmGCPAikt7',
        accessToken: 'ya29.a0ARrdaM-3VrIPf8w8VPu8ZCOZoNziGlZhuxMX6PK8vALYNkxDTQ5GX5cX_6ZDLuDJ1ZhPyUM5D-TcVYTYaQWt0GVb-FX920zItavuPdh5cyT1-fiLOSOWh9rPeHUOuKldSI5KkgJP75Q4IUqUdMbtgU0PCenczQSfPw',
        expires: 1639914601641
    }
});
transporter.set('oauth2_provision_cb', (user, renew, callback) => {
        // let accessToken = userTokens[user];
        // if(!accessToken){
        //     return callback(new Error('Unknown user'));
        // }else{
        //     return callback(null, accessToken);
        // }
        console.log('set');
        return callback(null, 'ya29.a0ARrdaM-3VrIPf8w8VPu8ZCOZoNziGlZhuxMX6PK8vALYNkxDTQ5GX5cX_6ZDLuDJ1ZhPyUM5D-TcVYTYaQWt0GVb-FX920zItavuPdh5cyT1-fiLOSOWh9rPeHUOuKldSI5KkgJP75Q4IUqUdMbtgU0PCenczQSfPw');
});

// booksname
var filename;
var filename1;
var fille1id;
var file2id;
var applicationError = "No Error ";
// connecting database to url
// mongoose.connect("mongodb+srv://admin-wcespace:WCESpace150401@cluster0.5htuy.mongodb.net/User",{useUnifiedTopology: true,useNewUrlParser: true});
// mongoose.connect(config.db.url,{useUnifiedTopology: true,useNewUrlParser: true});
mongodbutil.connectToServer(function (err, client) {
    if (err) {
        console.log(err);
        console.log("Network Error: " + err.message);
    } else console.log("Database connected!");
    // start the rest of your app here

});
// mongoose.connect('mongodb://localhost:27017/User',{ useUnifiedTopology: true , useNewUrlParser: true});

const userSchema = new mongoose.Schema({
    first_name: String,
    last_name: String,
    email: String,
    username: String,
    password: String,
    admin: Number,
    shelf: [],
    tokens: [
        {
            token: String
        }
    ]
});

const verifySchema = new mongoose.Schema({
    first_name: String,
    last_name: String,
    User_Email: String,
    // verify_link : 
})

const otpSchema = new mongoose.Schema({
    email: String,
    otp: Number
});
// Generating Tokens
userSchema.methods.generateAuthToken = function (req, res) {
    try {
        const token = jwt.sign({ _id: this._id }, process.env.SECRET_KEY);
        console.log(token);
        this.tokens = this.tokens.concat({ token: token });
        this.save();
        return token;
    } catch (error) {
        console.log("Error Part :" + error);
    }
};


userSchema.methods.generateAuthTokenForLogin = function (req, res) {
    try {
        const token = jwt.sign({ _id: this._id.toString() }, process.env.SECRET_KEY);
        this.save();
        return token;
    } catch (error) {
        console.log("Error Part :" + error);
    }
};


const User = mongoose.model("User", userSchema);
const Otp = mongoose.model("Otp", otpSchema);
const userVerification = mongoose.model("userVerification", verifySchema);

// contribute 
const CLIENT_ID = '77209510481-bl5aua8mgq1j86ahrr596qblqgr6mpb1.apps.googleusercontent.com';
const CLIENT_SECRENT = 'VZVjdR-gXIYDd1AmGCPAikt7';
const REDIRECT_URI = 'https%3A%2F%2Fdevelopers.google.com%2Foauthplayground&client_id=77209510481-bl5aua8mgq1j86ahrr596qblqgr6mpb1.apps.googleusercontent.com&client_secret=VZVjdR-gXIYDd1AmGCPAikt7&scope=&grant_type=authorization_code';
const REFRESH_TOKEN = '1//04m4nOQenv9UpCgYIARAAGAQSNwF-L9Ir16liWPaawKXdlt70gvFoFgvd3vGp2NMGyHcmWaBKMNjgL4qvDzraGN4-apLZXMwelqo';
const email = "wcespace1947@gmail.com";
const apis = google.getSupportedAPIs();

const oauth2client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRENT,
    REDIRECT_URI,
);

// google.options({
//     http2: true,
//   });

oauth2client.setCredentials({ refresh_token: REFRESH_TOKEN });

// google drive 
const drive = google.drive({
    version: 'v3',
    auth: oauth2client,
    tls: {
        rejectUnauthorized: false
    }
});

let booksstore = {
    year: "",
    branch: "",
    bookname: "",
    author: "",
    subject: "",
    imagelink: "",
    booklink: "",
}

let isSigningUp = false;
let validated = false;
let isLogin = false;

// This show which user is currently logged in
let curUser = {
    first_name: "",
    last_name: "",
    email: "",
    username: "",
    password: "",
    admin: 0,
    shelf: [],
    tokens: []
};
var temp_user = [];

app.get('/home', (req, res) => {
    try {
        const token = req.cookies.jwt;
        const verifyUser = jwt.verify(token, process.env.SECRET_KEY);
        console.log(verifyUser);

        User.findById(verifyUser._id, (err, doc) => {
            res.render('Other/home', { curUser: doc });
        });
    } catch (error) {
        res.render('Other/home', { curUser: curUser });
    }

});



const authorize = function (req, res, next) {
    try {
        const token = req.cookies.jwt;
        const verifyUser = jwt.verify(token, process.env.SECRET_KEY);
        console.log(verifyUser);

        User.findById(verifyUser._id, (err, doc) => {
            console.log(doc);
            req.token = token;
            req.user = doc;
            next();
        });
    } catch (error) {
        console.log("1    " + error);
    }
}

app.get('/logout', authorize, (req, res) => {

    try {
        res.clearCookie('jwt');
        console.log("Logout");
        req.user.save();
        res.redirect('/home');
    } catch (error) {
        console.log("2      " + error);
    }
});



app.get('/', (req, res) => {

    try {
        const token = req.cookies.jwt;
        const verifyUser = jwt.verify(token, process.env.SECRET_KEY);
        console.log(verifyUser);

        User.findById(verifyUser._id, (err, doc) => {
            if (verifyUser.admin == 1)
                res.redirect('/home');
            else {
                res.clearCookie('jwt');
                console.log(res);
                console.log('\n => \n' + req);
                // req.user.save();
                res.render('login/index');
            }
        });
    } catch (error) {
        console.log('Error in / => ' + error);
        res.render('login/index');
    }
});

app.post('/', (req, res) => {
    const [tempUserName, tempPassword] = [req.body.username, sha256(req.body.pass)];
    // console.log(tempUserName+" " + tempPassword);
    User.findOne({ $and: [{ username: tempUserName }, { password: tempPassword }] }, (err, doc) => {
        if (err) {
            console.log("There might be some error");
            res.redirect('/');
        }
        else {
            if (doc) {
                // console.log(doc.admin);
                if (doc.admin == 1) {
                    const token = doc.generateAuthTokenForLogin();
                    res.cookie("jwt", token, {
                        expires: new Date(Date.now() + 1800000),
                        httpOnly: true,
                    });

                    console.log(res);

                    res.redirect('/home');
                } else {
                    res.send('<script>alert("Please Verify Your Account to login"); window.location.replace("https://wcespace.herokuapp.com/");</script>');
                    return;
                    res.render('login/index');
                }

            }
            else {
                res.send('<script>alert("Invalid Credentials"); window.location.replace("https://wcespace.herokuapp.com/");</script>');
                return;
                res.redirect('/');
            }

        }
    });
});


app.get('/signup', (req, res) => {
    try {
        const token = req.cookies.jwt;
        const verifyUser = jwt.verify(token, process.env.SECRET_KEY);
        console.log(verifyUser);

        User.findById(verifyUser._id, (err, doc) => {
            if (verifyUser.admin == 1)
                res.redirect('/home');
            else {
                res.clearCookie('jwt');
                // req.user.save();
                res.render('login/signup');
            }
        });
    } catch (e) {
        console.log('Error in Signup + ' + e);
        res.render('login/signup');
    }
})


let curMail;

function verify_link(gmail) {
    return User.findOne({ $and: [{ User_Email: gmail }] }, { "_id": 1 })
        .then(result => {
            if (result) {
                console.log(`Successfully found document: ${result}.`);
            } else {
                console.log("No document matches the provided query.");
            }
            return result;
        })
        .catch(err => console.error(`Failed to find document: ${err}`));

}

app.post('/signup', (req, res) => {
    try {
        isSigningUp = true;
        const randNumber = Math.floor((Math.random()) * 10000);
        // console.log(randNumber);
        curMail = req.body.fname.toLowerCase() + "." + req.body.lname.toLowerCase() + "@walchandsangli.ac.in";
        const user_fname = req.body.fname;
        const user_lname = req.body.lname;
        const curPassword = sha256(req.body.pass);
        const curUsername = req.body.username;
        const gmail = req.body.fname.toLowerCase() + "." + req.body.lname.toLowerCase() + "@walchandsangli.ac.in";

        var verify_link_id;

        User.findOne({ email: gmail }, (err, doc) => {
            if (err)
                console.log("There might be some error in finding email");
            else {
                if (doc) {
                    res.send('<script> alert("Already Have an account");window.location.replace("https://wcespace.herokuapp.com/signup"); </script>');
                    return;
                    isSigningUp = false;
                    res.redirect('/signup');
                }
                else {

                    User.findOne({ User_Email: gmail }, async (error, result) => {
                        if (error)
                            console.log("There might be some problem in getting email");
                        else {

                            if (result) {
                                User.updateOne({ User_Email: gmail }, (err, doc) => {
                                    if (err)
                                        console.log("error in updation");
                                });
                            }
                            else {
                                try {
                                    // userVerification.insertMany([{ User_Email : gmail , first_name : user_fname ,last_name : user_lname }] , (err,doc)=>{
                                    //     if(err)
                                    //         console.log("There might be some problem in inserting mail");

                                    // });
                                    console.log("hello1");
                                    const new_verify = new userVerification({
                                        first_name: user_fname,
                                        last_name: user_lname,
                                        User_Email: req.body.fname.toLowerCase() + "." + req.body.lname.toLowerCase() + "@walchandsangli.ac.in",
                                    });
                                    const newUser = new User({
                                        first_name: user_fname,
                                        last_name: user_lname,
                                        email: gmail,
                                        username: curUsername,
                                        password: curPassword,
                                        admin: 0,
                                        shelf: [],
                                    });

                                    await newUser.save()
                                        .then(data => {
                                            // const token =  newUser.generateAuthToken();
                                            // res.cookie("jwt",token,{
                                            //     expires : new Date(Date.now()+1800000),
                                            //     httpOnly : true
                                            // });
                                            // console.log("hello3");
                                            const FirstName = req.body.fname.charAt(0).toUpperCase() + req.body.fname.slice(1).toLowerCase();
                                            const LastName = req.body.lname.charAt(0).toUpperCase() + req.body.lname.slice(1).toLowerCase();
                                            const mailText = " Dear " + FirstName + " " + LastName + "\nThank you for showing your interest in WCE SPACE." +
                                                "\nYour varification link for signing up in WCE SPACE is https://wcespace.herokuapp.com/verify/" + data._id +
                                                "\nThanks and Regards," +
                                                "\nPlease do not reply to this e-mail," +
                                                "this is a system generated email sent from an unattended mail box."
                                            var mailOptions = {
                                                from: "wcespace1947@gmail.com",
                                                to: gmail,
                                                subject: 'Email Varification for WCE SPACE sign up',
                                                text: mailText
                                            };
                                            console.log("hello4");
                                            transporter.sendMail({
                                                from: "wcespace1947@gmail.com",
                                                to: gmail,
                                                subject: 'Email Varification for WCE SPACE sign up',
                                                text: mailText,
                                                auth: {
                                                    user: 'wcespace1947@gmail.com',
                                                    accessToken: 'ya29.a0ARrdaM-3VrIPf8w8VPu8ZCOZoNziGlZhuxMX6PK8vALYNkxDTQ5GX5cX_6ZDLuDJ1ZhPyUM5D-TcVYTYaQWt0GVb-FX920zItavuPdh5cyT1-fiLOSOWh9rPeHUOuKldSI5KkgJP75Q4IUqUdMbtgU0PCenczQSfPw',
                                                    expires: 1639912073000
                                                }
                                            }).then(data => {
                                                    console.log('Email sent: ' + data.response);
                                                    // res.clearCookie('jwt');
                                                    res.send('<script> alert("Email is sent to your walchand college id. Please Verify it.");window.location.replace("https://wcespace.herokuapp.com/login"); </script>');
                                                    return;
                                                })
                                                .catch(err => {
                                                    res.send('<script> alert("Email has not been sent , Please Verify from admin.");window.location.replace("https://wcespace.herokuapp.com/login"); </script>');
                                            
                                                    console.log('Error in Email' + err);
                                                })
                                        })
                                        .catch(err => {
                                            console.log('Error in signup with database connection => ' + err);
                                        })

                                } catch (e) {
                                    console.log('Error in adding data and sending Email => ' + e);
                                }
                            }
                            //     return User.findOne({ $and:[{User_Email:gmail}] } , {"_id":1})
                            // .then(result => {
                            //     if(result) {
                            //         console.log(`Successfully found document: ${result}.`);
                            //         const FirstName = req.body.fname.charAt(0).toUpperCase()+ req.body.fname.slice(1).toLowerCase();
                            //         const LastName = req.body.lname.charAt(0).toUpperCase()+ req.body.lname.slice(1).toLowerCase();
                            //         const mailText = " Dear "+ FirstName +" "+ LastName + "\nThank you for showing your interest in WCE SPACE."+
                            //                         "\nYour varification link for signing up in WCE SPACE is https://wcespace.herokuapp.com/verify/" + result._id +
                            //                         "\nThanks and Regards," +
                            //                         "\nPlease do not reply to this e-mail,"+ 
                            //                         "this is a system generated email sent from an unattended mail box."

                            //         var mailOptions = {
                            //             from: "wcespace1947@gmail.com",
                            //             to: curMail,
                            //             subject: 'Email Varification for WCE SPACE sign up',
                            //             text: mailText
                            //         };
                            //         transporter.sendMail(mailOptions, function(error, info){
                            //             if (error) {
                            //             console.log(error);
                            //             } else {
                            //             console.log('Email sent: ' + info.response);
                            //             }
                            //         }); 
                            //         res.send('<script> alert("Email is sent in your walchand college id. Please Verify it.");window.location.replace("https://wcespace.herokuapp.com/"); </script>');
                            //         return;
                            //         res.redirect('/otp');
                            //     } else {
                            //         res.send('<script> alert("Something is wrong , Sorry for inconvenience Please try again"); window.location.replace("https://wcespace.herokuapp.com/signup");</script>');
                            //         return;
                            //         console.log("No document matches the provided query.");
                            //         res.redirect('/signup');
                            //     }
                            //     return result;
                            // })
                            // .catch(err => console.error(`Failed to find document: ${err}`));  
                            //     console.log("Success Part: "+ newUser);
                            //     res.send('<script> alert("Congratulations!! Account Created");window.location.replace("https://wcespace.herokuapp.com/"); </script>');
                            //     // res.send('<script> alert("Please Verify your account in your walchand college id."); </script>');
                            //     return;
                            //     res.redirect('/');

                            //     // new_verify.save();
                            //     // const newOTP = new Otp({
                            //     //     email : curMail,
                            //     //     otp : randNumber
                            //     // });
                            //     // newOTP.save();
                            // }
                            // // sending varification mail
                            // // verify_link_id = userVerification.findOne( {User_Email: (req.body.fname.toLowerCase() +"."+ req.body.lname.toLowerCase()+"@walchandsangli.ac.in")})
                            // // verify_link_id = verify_link(gmail);
                            // // console.log(verify_link_id);


                        }
                    });

                }
            }
        });
    } catch (e) {
        console.log('Error in signup with database connection => ' + e);
    }
});



app.get('/otp', (req, res) => {
    if (isSigningUp)
        res.render('login/otp');
    else
        res.redirect('/');
})

app.get("/verify/:id", (req, res) => {
    let id = req.params.id;
    const wrong = "Something is wrong try after some time";
    return User.findOne({ $and: [{ _id: id }] }, { _id: "1" })
        .then(result => {

            if (result) {
                // console.log(result);
                var query = { "_id": id };
                User.updateOne({ "_id": id }, { admin: 1 }, (err, doc) => {
                    if (err)
                        console.log("error in updation");
                    if (doc) {
                        console.log("You are now admin");
                        res.render('Other/verify', { verifyUserid: 0 });
                    }
                });
            } else {
                res.send('<script> alert("Invalid link"); window.location.replace("https://wcespace.herokuapp.com/");</script>');
                return;

            }
            return result;
        })
        .catch(err => res.render('Other/verify', { verifyUserid: 1 }));
})

app.post("/verify/:id", (req, res) => {
    let id = req.params.id;
    const wrong = "Something is wrong try after some time";
    return User.findOne({ $and: [{ _id: id }] }, { _id: "1" })
        .then(result => {
            if (result) {
                var query = { "_id": id };
                User.updateOne({ admin: 1 }, (err, doc) => {
                    if (err)
                        console.log("error in updation");
                });
                res.redirect('/');
            } else {
                res.send('<script> alert("Invalid link"); window.location.replace("https://wcespace.herokuapp.com/");</script>');
                return;
                res.render('Other/verify', { verifyUserid: 0 });
            }
            return result;
        })
        .catch(err => res.render('Other/verify', { verifyUserid: 1 }));
})

app.post('/otp', (req, res) => {
    Otp.findOne({ $and: [{ email: curMail }, { otp: req.body.otp }] }, (err, doc) => {
        if (err) {
            // console.log("error Otp validation");
            res.redirect("/");
        }
        else {
            if (doc) {
                Otp.deleteOne({ email: curMail, otp: req.body.otp }, (error) => {
                    if (!error) {
                        validated = true;
                        res.redirect('/info');
                    }
                })
            }
            else {
                // res.send('<script> alert("Invalid OTP"); </script>');

                res.redirect('/otp');
            }
        }
    })

})

app.get('/info', (req, res) => {
    try {
        const token = req.cookies.jwt;
        const verifyUser = jwt.verify(token, process.env.SECRET_KEY);
        console.log(verifyUser);

        User.findById(verifyUser._id, (err, doc) => {
            res.render('login/info');
        });

    } catch (e) {
        console.log('Error in info router + ' + e);
        res.redirect('/');
    }
});

app.post('/info', (req, res) => {
    const curPassword = sha256(req.body.pass);
    const curUsername = req.body.username;


    User.findOne({ username: curUsername }, (err, doc) => {
        if (err) {
            console.log("error in searching username");
        }
        else {
            if (doc) {
                res.send('<script> alert("This username already exists"); window.location.replace("https://wcespace.herokuapp.com/");</script>');

                res.redirect('/');
            }
            else {
                try {
                    const newUser = new User({
                        email: curMail,
                        username: curUsername,
                        password: curPassword,
                        admin: 1,
                        shelf: [],
                    });
                    const token = newUser.generateAuthToken();
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
})

app.get('/forget', (req, res) => {
    try {
        const token = req.cookies.jwt;
        const verifyUser = jwt.verify(token, process.env.SECRET_KEY);
        console.log(verifyUser);

        User.findById(verifyUser._id, (err, doc) => {
            if (verifyUser.length > 0)
                res.redirect('/');
            else {
                res.clearCookie('jwt');
                // req.user.save();
                res.render('login/forget');
            }
        });
    } catch (error) {
        console.log('Error in forget ' + error);
        res.redirect('/');
    }
});

app.post('/forget', (req, res) => {
    User.findOne({ username: req.body.username }, (err, doc) => {
        if (err)
            console.log("Error in forget pass process");
        else {
            if (doc) {
                const randNumber = Math.floor((Math.random()) * 1000000000);
                const tempMail = doc.email;
                console.log(sha256(String(randNumber)));
                User.updateOne({ username: req.body.username }, { password: sha256(String(randNumber)) }, (error) => {
                    if (err)
                        console.log("Error in updating")
                });

                console.log(tempMail);

                var mailOptions = {
                    from: "wcespace1947@gmail.com",
                    to: doc.email,
                    subject: 'Change Password for WCE SPACE Account',
                    text: "Hello " + doc.username + "\nYour Temporory password for WCE SPACE Log in is: " + String(randNumber) +
                        "\nPlease Don't Share it with anyone and We recommand you to change it ,  When"
                        + " You will log in using provided temporory password",
                        auth: {
                            user: 'wcespace1947@gmail.com',
                            accessToken: 'ya29.a0ARrdaM-3VrIPf8w8VPu8ZCOZoNziGlZhuxMX6PK8vALYNkxDTQ5GX5cX_6ZDLuDJ1ZhPyUM5D-TcVYTYaQWt0GVb-FX920zItavuPdh5cyT1-fiLOSOWh9rPeHUOuKldSI5KkgJP75Q4IUqUdMbtgU0PCenczQSfPw',
                            expires: 1639912073000
                        }
                };

                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log("Sending mail");
                    } else {
                        console.log('Email sent: ' + info.response);
                    }
                });
                res.send('<script> alert("Mail has been sent to your Walchand Email ID"); window.location.replace("https://wcespace.herokuapp.com/");</script>');

                res.redirect('/');
            }
            else {
                res.send('<script> alert("No such user is available"); window.location.replace("https://wcespace.herokuapp.com/forget");</script>');

                res.redirect('/forget');
            }
        }

    });
});

app.get('/cpass', (req, res) => {

    try {
        const token = req.cookies.jwt;
        const verifyUser = jwt.verify(token, process.env.SECRET_KEY);
        console.log(verifyUser);

        User.findById(verifyUser._id, (err, doc) => {
            res.render('login/cpass');
        });
    } catch (error) {
        res.redirect('/');
    }
});

app.post('/cpass', (req, res) => {
    const curPassword = sha256(req.body.cur_pass);
    const newPassword = sha256(req.body.new_pass);

    console.log(newPassword);
    console.log(curUser);


    try {
        const token = req.cookies.jwt;
        const verifyUser = jwt.verify(token, process.env.SECRET_KEY);
        console.log(verifyUser);

        User.findById(verifyUser._id, (err, curUser) => {
            if (err)
                console.log("Error");
            else {
                if (curUser) {
                    User.updateOne({ username: curUser.username }, { password: newPassword }, (error) => {
                        if (error)
                            console.log("Error in updating");
                    });
                    res.send('<script> alert("Your Password Has been updated"); </script>');

                    res.redirect('/home');
                }
                else {
                    res.send('<script>alert("Please Enter Correct Current Password");window.location.replace("https://wcespace.herokuapp.com/cpass"); </script>');

                    res.redirect('/cpass');
                }
            }
        });
    } catch (error) {
        res.redirect('/');
    }


    User.findOne({ $and: [{ username: curUser.username }, { password: curPassword }] }, (err, doc) => {

    });
});

// other route 

// CSE books
const CSEschema = new mongoose.Schema({
    year: String,
    bookname: String,
    author: String,
    subject: String,
    imgUrl: String,
    bookUrl: String
});
// IT books
const ITschema = new mongoose.Schema({
    year: String,
    bookname: String,
    author: String,
    subject: String,
    imgUrl: String,
    bookUrl: String
});
// ELE books
const ELEschema = new mongoose.Schema({
    year: String,
    bookname: String,
    author: String,
    subject: String,
    imgUrl: String,
    bookUrl: String
});
// ELET books
const ELETschema = new mongoose.Schema({
    year: String,
    bookname: String,
    author: String,
    subject: String,
    imgUrl: String,
    bookUrl: String
});
// MECH books
const MECHschema = new mongoose.Schema({
    year: String,
    bookname: String,
    author: String,
    subject: String,
    imgUrl: String,
    bookUrl: String
});
// CIVIL books
const CIVILschema = new mongoose.Schema({
    year: String,
    bookname: String,
    author: String,
    subject: String,
    imgUrl: String,
    bookUrl: String
});



const CSE = mongoose.model("CSE", CSEschema);
const IT = mongoose.model("IT", ITschema);
const ELE = mongoose.model("ELE", ELEschema);
const ELET = mongoose.model("ELET", ELETschema);
const MECH = mongoose.model("MECH", MECHschema);
const CIVIL = mongoose.model("CIVIL", CIVILschema);




var sampleCSE = new CSE({
    year: 'fy',
    bookname: "Python",
    author: "Pavan Shinde",
    subject: "Coding",
    imgUrl: 'https://media.newstracklive.com/uploads/sports-news/cricket/Aug/14/big_thumb/msd2_5f3609e79d303.jpg',
    bookUrl: 'https://drive.google.com/file/d/1hxhUvb1FZW8dXgbIcF8JDPWAajkhuTVE/view?usp=sharing'
})
// sampleCSE.save();

// file to upload in google drive 
const filepath = path.join(__dirname, 'dc.png');

async function generatePublicurl(fileid, filedata) {
    try {
        const fileId = fileid;
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });

        const result = await drive.files.get({
            fileId: fileId,
            fields: 'webViewLink, webContentLink',
        });
        // console.log(result.data);
        if (filedata === 'myFile1') {
            booksstore.booklink = result.data.webViewLink;
            Promise.all(result.data.webViewLink)
                .then(function () { booksstore.booklink = result.data.webViewLink; })
                .catch(console.error);
        }
        if (filedata === 'myFile2') {
            booksstore.imagelink = 'https://drive.google.com/uc?export=view&id=' + fileId;

            console.log(sampleCSE.imgUrl);
            Promise.all(booksstore.imagelink)
                .then(function () {
                    Promise.all(booksstore.booklink)
                        .then(function () {
                            // alert('data successfully saved. Thank You For contributing Us......'); 
                            const path = './public/books/' + filename;
                            const path1 = './public/books/' + filename1;

                            try {
                                fs.unlinkSync(path);
                                fs.unlinkSync(path1);
                                // console.log("File Deleted ")
                                //file removed
                            } catch (err) {
                                console.error(err);
                            }
                        })
                        .catch(console.error);
                })
                .catch(console.error);
        }
        // else 
        // console.log("Somthing is Wrong");
        // console.log(booksstore);

    } catch (error) {
        console.log(error.message);
    }
}

// To upload file 
// to upload file in google drive => function 
// below function is a  function 
async function uploadFile(mimetype, bookname, filedata) {
    var bookname1 = 'dcbook.pdf';
    // console.log(bookname,bookname1);
    try {
        const response = await drive.files.create({
            requestBody: {
                name: bookname,
                mimeType: mimetype,
            },
            media: {
                mimeType: mimetype,
                body: fs.createReadStream('./public/books/' + bookname),
            }
        })
        var promises = response.data.id;
        if (filedata === 'myFile1')
            fille1id = response.data.id;
        if (filedata === 'myFile2')
            file2id = response.data.id;
        // console.log(response.data.id);
        Promise.all(promises)
            .then(function () { generatePublicurl(response.data.id, filedata); console.log('File uploaded in drive creating link wait....'); })
            .catch(console.error);

    } catch (error) {
        res.redirect("Other/error")
        console.error(error.message);
    }
}

// uploadFile();
function intervalFunc() {
    console.log('Wait');
}


// to delete file from google drive 
async function deletefilr(fileid) {
    try {
        const response = await drive.files.delete({
            fileId: fileid,
        });
        console.log(response.data, response.status);
    } catch (error) {
        console.log("error.message");
    }
}

// deletefilr();

app.get("/contribute", function (req, res) {
    try {
        const token = req.cookies.jwt;
        const verifyUser = jwt.verify(token, process.env.SECRET_KEY);
        console.log(verifyUser);

        User.findById(verifyUser._id, (err, doc) => {
            if (!err) {
                if (doc.admin === 1) {
                    res.render("Other/contribute", { curUser: doc })
                }
                else
                    res.redirect('/');
            }
        });
    } catch (error) {
        res.redirect('/');
    }
});

app.post('/contribute', (req, res) => {


    dir = './public/books';
    // if (!fs.existsSync(dir)){
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
                var waitTill = new Date(new Date().getTime() + 10000);
                while (waitTill > new Date()) { };

                viewLinkbook = uploadFile(file.mimetype, filename, 'myFile1');
                while (waitTill > new Date()) { };
            }
        });
        var waitTill = new Date(new Date().getTime() + 2 * file.size / 1000000);
        // setInterval(intervalFunc, 10000);
        while (waitTill > new Date()) { }
        if (req.files.myFile2) {
            var file = req.files.myFile2;
            filename1 = file.name;
            file.mv('./public/books/' + filename1, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    // console.log("File Uploaded ");
                    waitTill = new Date(new Date().getTime() + 20000);
                    while (waitTill > new Date()) { }
                    viewLinkimage = uploadFile(file.mimetype, filename1, 'myFile2');
                    while (waitTill > new Date()) { };
                }
            });
        } else {
            fileid = '1-yxOyT4sOXSI1d-urXz9hYKhTyXPmpcm';
            waitTill = new Date(new Date().getTime() + 10000);
            while (waitTill > new Date()) { }
            generatePublicurl(fileid, 'myFile2');
            booksstore.imgUrl = 'https://drive.google.com/uc?export=view&id=1-yxOyT4sOXSI1d-urXz9hYKhTyXPmpcm';
        }
    }
    var waitTill = new Date(new Date().getTime() + 3 * file.size / 1000000);
    while (waitTill > new Date()) { }
    res.redirect("/save");
    // console.log(filename+" File Uploaded "); 
    // console.log(filename1+" File Uploaded "); 
    // console.log(file);
});

///////////////////////////////////////////////
app.get("/save", function (req, res) {
    try {
        const token = req.cookies.jwt;
        const verifyUser = jwt.verify(token, process.env.SECRET_KEY);
        console.log(verifyUser);

        User.findById(verifyUser._id, (err, doc) => {
            if (!err) {
                if (doc.admin === 1) {
                    res.render("Other/save", { curUser: doc, booksstore: booksstore })
                }
                else
                    res.redirect('/');
            }
        });
    } catch (error) {
        res.redirect('/');
    }
});

app.post("/save", (req, res) => {
    if (booksstore.imagelink === "" || booksstore.booklink === "") {
        applicationError = "Something is Wrong Book is not uploaded because of link is not created or any other problem related to contribute page...";
        res.redirect("/error");
    } else {
        if (booksstore.branch === "CSE") {
            sampleCSE = new CSE({
                year: booksstore.year,
                bookname: booksstore.bookname,
                author: booksstore.author,
                subject: booksstore.subject,
                imgUrl: booksstore.imagelink,
                bookUrl: booksstore.booklink,
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
                    bookUrl: booksstore.booklink,
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
                        bookUrl: booksstore.booklink,
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
                            bookUrl: booksstore.booklink,
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
                                bookUrl: booksstore.booklink,
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
                                    bookUrl: booksstore.booklink,
                                });
                                sampleCSE.save();
                            } else {
                                deletefilr(fille1id);
                                deletefilr(file2id);
                                res.send('<script>alert("You didnt selected any branch Please Try again!!!");window.location.replace("https://wcespace.herokuapp.com/contribute"); </script>');
                                return;

                            }
                        }
                    }
                }
            }
        }
        res.redirect("/contribute");
    }
});

////////////////////////////////////////////
app.get("/resources", function (req, res) {

    try {
        const token = req.cookies.jwt;
        const verifyUser = jwt.verify(token, process.env.SECRET_KEY);
        console.log(verifyUser);

        User.findById(verifyUser._id, (err, doc) => {
            if (!err) {
                res.render("Other/resources", { curUser: doc })
            }
        });
    } catch (error) {
        res.redirect('/');
    }
});

app.get("/resources/:yrbr", function (req, res) {

    try {
        const token = req.cookies.jwt;
        const verifyUser = jwt.verify(token, process.env.SECRET_KEY);
        console.log(verifyUser);

        User.findById(verifyUser._id, (err, curUser) => {
            if (!err) {
                let yrbr = req.params.yrbr;
                // CSE
                if (yrbr === 'fycse') {
                    CSE.find({ year: 'fy' }, (err, doc) => {
                        if (!err) {
                            if (doc) {
                                res.render('Other/books', { curUser: curUser, bookinfo: doc, yrbr: yrbr });
                            }
                        }
                    })
                }
                if (yrbr === 'sycse') {
                    CSE.find({ year: 'sy' }, (err, doc) => {
                        if (!err) {
                            if (doc) {
                                res.render('Other/books', { curUser: curUser, bookinfo: doc, yrbr: yrbr });
                            }
                        }
                    })
                }
                if (yrbr === 'tycse') {
                    CSE.find({ year: 'ty' }, (err, doc) => {
                        if (!err) {
                            if (doc) {
                                res.render('Other/books', { curUser: curUser, bookinfo: doc, yrbr: yrbr });
                            }
                        }
                    })
                }
                if (yrbr === 'btechcse') {
                    CSE.find({ year: 'btech' }, (err, doc) => {
                        if (!err) {
                            if (doc) {
                                res.render('Other/books', { curUser: curUser, bookinfo: doc, yrbr: yrbr });
                            }
                        }
                    })
                }
                // IT
                if (yrbr === 'fyit') {
                    IT.find({ year: 'fy' }, (err, doc) => {
                        if (!err) {
                            if (doc) {
                                res.render('Other/books', { curUser: curUser, bookinfo: doc, yrbr: yrbr });
                            }
                        }
                    })
                }
                if (yrbr === 'syit') {
                    IT.find({ year: 'sy' }, (err, doc) => {
                        if (!err) {
                            if (doc) {
                                res.render('Other/books', { curUser: curUser, bookinfo: doc });
                            }
                        }
                    })
                }
                if (yrbr === 'tyit') {
                    IT.find({ year: 'ty' }, (err, doc) => {
                        if (!err) {
                            if (doc) {
                                res.render('Other/books', { curUser: curUser, bookinfo: doc, yrbr: yrbr });
                            }
                        }
                    })
                }
                if (yrbr === 'btechit') {
                    IT.find({ year: 'btech' }, (err, doc) => {
                        if (!err) {
                            if (doc) {
                                res.render('Other/books', { curUser: curUser, bookinfo: doc, yrbr: yrbr });
                            }
                        }
                    })
                }
                // ELE
                if (yrbr === 'fyele') {
                    ELE.find({ year: 'fy' }, (err, doc) => {
                        if (!err) {
                            if (doc) {
                                res.render('Other/books', { curUser: curUser, bookinfo: doc, yrbr: yrbr });
                            }
                        }
                    })
                }
                if (yrbr === 'syele') {
                    ELE.find({ year: 'sy' }, (err, doc) => {
                        if (!err) {
                            if (doc) {
                                res.render('Other/books', { curUser: curUser, bookinfo: doc });
                            }
                        }
                    })
                }
                if (yrbr === 'tyele') {
                    ELE.find({ year: 'ty' }, (err, doc) => {
                        if (!err) {
                            if (doc) {
                                res.render('Other/books', { curUser: curUser, bookinfo: doc, yrbr: yrbr });
                            }
                        }
                    })
                }
                if (yrbr === 'btechele') {
                    ELE.find({ year: 'btech' }, (err, doc) => {
                        if (!err) {
                            if (doc) {
                                res.render('Other/books', { curUser: curUser, bookinfo: doc, yrbr: yrbr });
                            }
                        }
                    })
                }
                // ELET
                if (yrbr === 'fyelet') {
                    ELET.find({ year: 'fy' }, (err, doc) => {
                        if (!err) {
                            if (doc) {
                                res.render('Other/books', { curUser: curUser, bookinfo: doc, yrbr: yrbr });
                            }
                        }
                    })
                }
                if (yrbr === 'syelet') {
                    ELET.find({ year: 'sy' }, (err, doc) => {
                        if (!err) {
                            if (doc) {
                                res.render('Other/books', { curUser: curUser, bookinfo: doc });
                            }
                        }
                    })
                }
                if (yrbr === 'tyelet') {
                    ELET.find({ year: 'ty' }, (err, doc) => {
                        if (!err) {
                            if (doc) {
                                res.render('Other/books', { curUser: curUser, bookinfo: doc, yrbr: yrbr });
                            }
                        }
                    })
                }
                if (yrbr === 'btechelet') {
                    ELET.find({ year: 'btech' }, (err, doc) => {
                        if (!err) {
                            if (doc) {
                                res.render('Other/books', { curUser: curUser, bookinfo: doc, yrbr: yrbr });
                            }
                        }
                    })
                }
                // MECH
                if (yrbr === 'fymech') {
                    MECH.find({ year: 'fy' }, (err, doc) => {
                        if (!err) {
                            if (doc) {
                                res.render('Other/books', { curUser: curUser, bookinfo: doc, yrbr: yrbr });
                            }
                        }
                    })
                }
                if (yrbr === 'symech') {
                    MECH.find({ year: 'sy' }, (err, doc) => {
                        if (!err) {
                            807969029
                            if (doc) {
                                res.render('Other/books', { curUser: curUser, bookinfo: doc });
                            }
                        }
                    })
                }
                if (yrbr === 'tymech') {
                    MECH.find({ year: 'ty' }, (err, doc) => {
                        if (!err) {
                            if (doc) {
                                res.render('Other/books', { curUser: curUser, bookinfo: doc, yrbr: yrbr });
                            }
                        }
                    })
                }
                if (yrbr === 'btechmech') {
                    MECH.find({ year: 'btech' }, (err, doc) => {
                        if (!err) {
                            if (doc) {
                                res.render('Other/books', { curUser: curUser, bookinfo: doc, yrbr: yrbr });
                            }
                        }
                    })
                }
                // CIVIL
                if (yrbr === 'fycivil') {
                    CIVIL.find({ year: 'fy' }, (err, doc) => {
                        if (!err) {
                            if (doc) {
                                res.render('Other/books', { curUser: curUser, bookinfo: doc, yrbr: yrbr });
                            }
                        }
                    })
                }
                if (yrbr === 'sycivil') {
                    CIVIL.find({ year: 'sy' }, (err, doc) => {
                        if (!err) {
                            if (doc) {
                                res.render('Other/books', { curUser: curUser, bookinfo: doc });
                            }
                        }
                    })
                }
                if (yrbr === 'tycivil') {
                    CIVIL.find({ year: 'ty' }, (err, doc) => {
                        if (!err) {
                            if (doc) {
                                res.render('Other/books', { curUser: curUser, bookinfo: doc, yrbr: yrbr });
                            }
                        }
                    })
                }
                if (yrbr === 'btechcivil') {
                    CIVIL.find({ year: 'btech' }, (err, doc) => {
                        if (!err) {
                            if (doc) {
                                res.render('Other/books', { curUser: curUser, bookinfo: doc, yrbr: yrbr });
                            }
                        }
                    })
                }
            }
        });
    } catch (error) {
        res.redirect('/');
    }

    if (isLogin) {

    }

});

app.post("/resources/:yrbr", function (req, res) {
    let yrbr = req.params.yrbr;
    var wishyrbr = req.body.wish_yrbr;
    var wishId = req.body.id;
    var wishyear = req.body.year;
    var list = { year: wishyear, id: wishId }

    let x = CSE;
    console.log(yrbr);

    try {
        const token = req.cookies.jwt;
        const verifyUser = jwt.verify(token, process.env.SECRET_KEY);
        console.log(verifyUser);

        User.findById(verifyUser._id, (err, curUser) => {
            CSE.findOne({ $and: [{ year: list.year }, { _id: list.id }] }, (err, doc) => {
                if (!err && doc) {
                    let curShelf = [];
                    User.findOne({ username: curUser.username }, (err, result) => {
                        if (!err) {

                            curShelf = result.shelf;
                            let i = 0;

                            for (i = 0; i < curShelf.length; i++) {
                                if (JSON.stringify(curShelf[i]) === JSON.stringify(doc)) {
                                    break;
                                }
                            }
                            // console.log(curShelf.length+" "+i);
                            // Book not in shelf
                            if (i === curShelf.length) {
                                curShelf.push(doc);
                            }
                            // Book is in shelf
                            else {
                                curShelf.splice(i, 1);
                            }
                            User.updateOne({ username: curUser.username }, { shelf: curShelf }, (err) => {
                                if (!err) {
                                    // console.log("Shelf Updated Successfully");
                                    res.redirect("/resources/" + yrbr);
                                }
                            });
                            User.findOne({ username: curUser.username }, (err, doc) => {
                                if (!err)
                                    curUser = doc;
                            })

                        }
                    });

                }
            });
            IT.findOne({ $and: [{ year: list.year }, { _id: list.id }] }, (err, doc) => {
                if (!err && doc) {
                    let curShelf = [];
                    User.findOne({ username: curUser.username }, (err, result) => {
                        if (!err) {

                            curShelf = result.shelf;
                            let i = 0;

                            for (i = 0; i < curShelf.length; i++) {
                                if (JSON.stringify(curShelf[i]) === JSON.stringify(doc)) {
                                    break;
                                }
                            }
                            console.log(curShelf.length + " " + i);
                            // Book not in shelf
                            if (i === curShelf.length) {
                                curShelf.push(doc);
                            }
                            // Book is in shelf
                            else {
                                curShelf.splice(i, 1);
                            }
                            User.updateOne({ username: curUser.username }, { shelf: curShelf }, (err) => {
                                if (!err) {
                                    console.log("Shelf Updated Successfully");
                                    res.redirect("/resources/" + yrbr);
                                }
                            });
                            User.findOne({ username: curUser.username }, (err, doc) => {
                                if (!err)
                                    curUser = doc;
                            })

                        }
                    });

                }
            });
        });
    } catch (error) {
        res.redirect('/');
    }



});

app.get('/shelf', (req, res) => {

    try {
        const token = req.cookies.jwt;
        const verifyUser = jwt.verify(token, process.env.SECRET_KEY);
        console.log(verifyUser);

        User.findById(verifyUser._id, (err, doc) => {
            if (!err) {
                if (!err) {
                    curShelf = doc.shelf;
                    console.log(curUser.shelf.length);
                }
                res.render('Other/shelf', { bookinfo: curShelf, curUser: doc });
            }
        });
    } catch (error) {
        res.redirect('/');
    }
});


// error page 
app.get("/error", function (req, res) {
    var today = new Date();
    var currentday = today.getDay();

    var options = {
        weekday: "long",
        day: "numeric",
        month: "long"
    };

    var day = today.toLocaleDateString("en-US", options);
    try {
        const token = req.cookies.jwt;
        const verifyUser = jwt.verify(token, process.env.SECRET_KEY);
        console.log(verifyUser);

        User.findById(verifyUser._id, (err, doc) => {
            if (!err) {
                if (doc.admin === 1) {
                    res.render("Other/error", { kindofday: day, newListItem: applicationError })
                    // res.render("Other/save",{curUser : doc,booksstore:booksstore})               
                }
                else
                    res.redirect('/');
            }
        });
    } catch (error) {
        res.redirect('/');
    }
});



app.get('/:error', (req, res) => {
    let query = req.params.error;
    // console.log(query);
    res.render("Other/404.ejs");
});

let port = process.env.PORT;
if (port == null || port == "") {
    port = 5000;
}

app.listen(port, function () {
    console.log("server has started Successfully");
});