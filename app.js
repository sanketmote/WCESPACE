const express  = require('express');

const app = express('express');

const BodyParser = require('body-parser');

var alert = require('alert');

const sha256 = require('sha256');

// sending varification mail
var nodemailer = require('nodemailer');
// Author
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'wcespace1947@gmail.com',
    pass: 'WCESpace@150401'
  }
});


// requiring
const mongoose = require('mongoose');

// connecting database to url
mongoose.connect("mongodb://localhost:27017/User",{useUnifiedTopology: true,useNewUrlParser: true});

// Creating schema
// for users
const userSchema = new mongoose.Schema({
    email : String,
    username : String,
    password : String 
});
// for otps
const otpSchema = new mongoose.Schema({
    email : String,
    otp : Number
});


let samplePassword = "pavan";
samplePassword = sha256(samplePassword); 
// console.log(samplePassword);

// creating model
// for users
const User = mongoose.model("User" , userSchema);
// for otp
const Otp = mongoose.model("Otp",otpSchema);


const sampleUser = new User({
    email : "pavan.shinde@walchandsangli.ac.in",
    username : "pavanshinde7494",
    password : samplePassword
});

const sampleOtp = new Otp({
    email : "pavan.shinde@walchandsangli.ac.in",
    otp : 7777
});
// sampleOtp.save();

app.use(BodyParser.urlencoded({extended : true}));

app.use(express.static("public"));

app.set('view engine' , 'ejs');

let isSigningUp = false;
let validated = false;
let isLogin = false;

// This show which user is currently logged in
let curUser = "";


app.get('/home',(req,res)=>{
    res.render('Other/home',{curUser : curUser});
});


app.get('/logout',(req,res)=>{
    isLogin = false;
    curUser = "";
    res.redirect('/home');
});



app.get('/',(req,res)=>{
    if(isLogin)
        res.render('/home');
    else
        res.render('login/index');
}); 

app.post('/',(req,res)=>{
    const [ tempUserName , tempPassword ] = [req.body.username , sha256(req.body.pass) ];
    // console.log(tempUserName+" " + tempPassword);
    User.findOne({ $and : [{ username : tempUserName },{ password : tempPassword }] } ,(err,doc)=>{
        if(err)
        {
            console.log("There might be some error");
            res.redirect('/login');
        }
        else{
            if(doc)
            {
                curUser = req.body.username;
                isLogin = true;
                res.redirect('/home');
            }
            else{
                alert("Invalid Credentials");
                res.redirect('/');
            }
            
        }
    } );
});


app.get('/signup',(req,res)=>{
    res.render('login/signup',{fname: "Pavan" ,lname : "Shinde"});
})


let curMail ; 

app.post('/signup',(req,res)=>{
    isSigningUp = true;
    const randNumber = Math.floor((Math.random())*10000);
    // console.log(randNumber);
    curMail = req.body.fname.toLowerCase() +"."+ req.body.lname.toLowerCase()+"@walchandsangli.ac.in";
    User.findOne( { email : curMail },(err,doc)=>{
        if(err)
            console.log("There might be some error in finding email");
        else{
            if(doc)
            {
                
                alert("Already Have an account");
                res.redirect('/signup');
            }
            else{

                Otp.findOne({ email : curMail },(error,result)=>{
                    if(error)
                        console.log("There might be some problem in getting email");
                    else{

                        if(result)
                        {
                            Otp.updateOne({ email : curMail } , { otp : randNumber },(err,doc)=>{
                                if(err)
                                    console.log("error in updation");
                            });
                        }
                        else
                        {
                            Otp.insertMany([{ email : curMail , otp : randNumber}] , (err,doc)=>{
                                if(err)
                                    console.log("There might be some problem in inserting mail");
                            });
                        }

                        // sending varification mail
                        const FirstName = req.body.fname.charAt(0).toUpperCase()+ req.body.fname.slice(1).toLowerCase();
                        const LastName = req.body.lname.charAt(0).toUpperCase()+ req.body.lname.slice(1).toLowerCase();
                        const mailText = " Dear "+ FirstName +" "+ LastName + "\nThank you for showing your interest in WCE SPACE."+
                                        "\nYour varification OTP for signing up in WCE SPACE is " + randNumber+
                                        "\nThanks and Regards," +
                                        "\nPlease do not reply to this e-mail,"+ 
                                        "this is a system generated email sent from an unattended mail box."
                        
                        var mailOptions = {
                            from: "wcespace1947@gmail.com",
                            to: curMail,
                            subject: 'Email Varification for WCE SPACE sign up',
                            text: mailText
                        };
                        
                        transporter.sendMail(mailOptions, function(error, info){
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
    } );       
});


app.get('/otp',(req,res)=>{
    if(isSigningUp)
        res.render('login/otp');
    else
        res.send("Fuck Off");
})

app.post('/otp',(req,res)=>{
    Otp.findOne( {$and: [{ email: curMail},{ otp : req.body.otp }]} , (err,doc)=>{
        if(err)
        {
            console.log("error Otp validation");
            res.redirect("/");
        }
        else{
            if(doc)
            {
                
                Otp.deleteOne({ email: curMail, otp : req.body.otp },(error)=>{
                    if(error)
                        console.log("error in deletion otp");
                    else
                    {
                        validated = true;
                        res.redirect('/info');
                    }
                })
            }
            else{
                res.send("Invalid Otp");
            }
        }
    })    
    
})

app.get('/info',(req,res)=>{
    if(isSigningUp && validated && !isLogin){
        isSigningUp = false;
        validated = false;
        res.render('login/info');
    }
    else
        res.send("Fuck Off");
});

app.post('/info',(req,res)=>{
    const curPassword = sha256(req.body.pass);
    const curUsername = req.body.username;


    User.findOne( { username : curUsername } , (err,doc)=>{
        if(err)
        {
            console.log("error in searching username");
        }
        else{
            if(doc)
            {
                res.send("Already have an account");
            }
            else{
                User.insertMany ([{ email : curMail , password : curPassword , username : curUsername}] , (err)=>{
                    if(err)
                        console.log("Error in successful signup");
                    else{
                        alert('You have been signed up successfully');
                        res.redirect('/');
                    }
                });
            }
        }
    });
})

app.get('/forget' , (req,res)=>{
    res.render('login/forget');
});

app.post('/forget' , (req,res)=>{
    User.findOne({ username : req.body.username } , (err , doc)=>{
        if(err)
            console.log("Error in forget pass process");
        else{
            if(doc)
            {
                const randNumber = Math.floor((Math.random())*1000000000);
                const tempMail =  doc.email;
                console.log(sha256(String(randNumber)));
                User.updateOne({ username : req.body.username } , { password : sha256(String(randNumber))},(error)=>{
                    if(err)
                        console.log("Error in updating")
                });

                console.log(tempMail);

                var mailOptions = {
                    from: "wcespace1947@gmail.com",
                    to: doc.email,
                    subject: 'Email Varification for WCE SPACE sign up',
                    text: String(randNumber)
                };
                
                transporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                    console.log("Sending mail");
                    } else {
                    console.log('Email sent: ' + info.response);
                    }
                }); 

                alert('Mail has been sent to your Walchand Email ID');
                res.redirect('/');
            }
            else
            {
                alert("No such user is available");
                res.redirect('/forget');
            }
        }
        
    });
});

app.get('/cpass',(req,res)=>{
    res.render('login/cpass');
});

app.post('/cpass',(req,res)=>{
    const curPassword = sha256(req.body.cur_pass); 
    const newPassword = sha256(req.body.new_pass); 

    console.log(newPassword);
    console.log(curUser);

    User.findOne({ $and : [{ username : curUser } , { password : curPassword }]} , (err,doc)=>{
        if(err)
            console.log("Error");
        else{
            
            if(doc)
            {
                User.updateOne( { username : curUser } , { password : newPassword } ,(error)=>{
                    if(error)
                    console.log("Error in updating");
                })
            }
        }
        res.redirect('/home');
    });
});

app.listen(3000,()=>{
    console.log("server is running on port 3000");
});
  
