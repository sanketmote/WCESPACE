require('dotenv').config();
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const { auth } = require('googleapis/build/src/apis/abusiveexperiencereport');

const express  = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
// const app = express('express');
const bodyparser = require("body-parser");
const upload = require('express-fileupload'); 
const app = express();

var alert = require('alert');
const sha256 = require('sha256');
const ejs = require('ejs');
const mongoose = require('mongoose');

const { forEach } = require('./books');
var nodemailer = require('nodemailer');

app.use(bodyparser.urlencoded({extended:true}));
app.use(express.static("public"));
app.use(upload());
app.use(cookieParser());
app.set('view engine' , 'ejs');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'wcespace1947@gmail.com',
      pass: 'WCESpace@150401'
    }
  });
// booksname
var filename;
var filename1;
var fille1id;
var file2id;

// connecting database to url
// mongoose.connect("mongodb+srv://admin-wcespace:WCESpace150401@cluster0.5htuy.mongodb.net/User",{useUnifiedTopology: true,useNewUrlParser: true});
mongoose.connect("mongodb://admin-wcespace:WCESpace150401@cluster0-shard-00-00.5htuy.mongodb.net:27017,cluster0-shard-00-01.5htuy.mongodb.net:27017,cluster0-shard-00-02.5htuy.mongodb.net:27017/User?ssl=true&replicaSet=atlas-rps98p-shard-0&authSource=admin&retryWrites=true&w=majority",{useUnifiedTopology: true,useNewUrlParser: true});
// mongoose.connect('mongodb://localhost:27017/User',{ useUnifiedTopology: true , useNewUrlParser: true});

const userSchema = new mongoose.Schema({
    email : String,
    username : String,
    password : String ,
    admin : Number,
    shelf : [],
    tokens : [
        {
            token : String
        }
    ]
});

const otpSchema = new mongoose.Schema({
    email : String,
    otp : Number
});
// Generating Tokens
userSchema.methods.generateAuthToken  =  function(req,res){
    try {
        const token = jwt.sign( { _id : this._id }, process.env.SECRET_KEY );
        console.log(token);
        this.tokens = this.tokens.concat({token : token});
        this.save();
        return token;
    } catch (error) {
        console.log("Error Part :"+error);
    }
};


userSchema.methods.generateAuthTokenForLogin  =  function(req,res){
    try {
        const token = jwt.sign( { _id : this._id.toString() }, process.env.SECRET_KEY );
        this.save();
        return token;
    } catch (error) {
        console.log("Error Part :"+err);
    }
};


const User = mongoose.model("User" , userSchema);
const Otp = mongoose.model("Otp",otpSchema);

// contribute 
const CLIENT_ID = '382614871956-6pecnaqrkthd4qac7nqm7spg037irfcd.apps.googleusercontent.com';
const CLIENT_SECRENT = 'nnqLnJLHUkFI9Vhk6ShfvV4T';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = '1//04C0RgYqHIpk5CgYIARAAGAQSNwF-L9IrSW0Mx3M1yWNhzBzFiffMvQP03-i4If_7x2oL-FdMzrk0OfHPuahFRm8hpn9DXVSFtdg';
const email = "wcespace1947@gmail.com";
const oauth2client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRENT,
    REDIRECT_URI,
    email,

);

oauth2client.setCredentials({ refresh_token: REFRESH_TOKEN });

// google drive 
const drive = google.drive({
    version: 'v3',
    auth : oauth2client,
    tls: {
        rejectUnauthorized: false
    }
});

let booksstore = {
    year: "",
    branch: "",
    bookname : "",
    author : "",
    subject : "",
    imagelink : "",
    booklink : "",
}

let isSigningUp = false;
let validated = false;
let isLogin = false;

// This show which user is currently logged in
let curUser = {
    email : "",
    username : "",
    password : "",
    admin : 0,
    shelf : [],
    tokens : []
};


app.get('/home',(req,res)=>{
    try {
        const token = req.cookies.jwt;
        const verifyUser =  jwt.verify(token,process.env.SECRET_KEY);
        console.log(verifyUser);

        User.findById(verifyUser._id,(err,doc)=>{
            res.render('Other/home',{curUser : doc});
        });
    } catch (error) {
        res.render('Other/home',{curUser : curUser});
    }
    
});



const authorize =  function(req , res , next){
    try {
        const token = req.cookies.jwt;
        const verifyUser =  jwt.verify(token,process.env.SECRET_KEY);
        console.log(verifyUser);

        User.findById(verifyUser._id,(err,doc)=>{
            console.log(doc);
            req.token = token;
            req.user = doc;
            next();
        });
    } catch (error) {
        console.log("1    "+error);
    }
}

app.get('/logout', authorize ,(req,res)=>{

    try {
        res.clearCookie('jwt');
        console.log("Logout");
        req.user.save();
        res.redirect('/home');
    } catch (error) {
        console.log("2      "+error);
    }
});



app.get('/',(req,res)=>{

    try {
        const token = req.cookies.jwt;
        const verifyUser =  jwt.verify(token,process.env.SECRET_KEY);
        console.log(verifyUser);

        User.findById(verifyUser._id,(err,doc)=>{
            res.redirect('/home');
        });
    } catch (error) {
        res.render('login/index');
    }
}); 

app.post('/',(req,res)=>{
    const [ tempUserName , tempPassword ] = [req.body.username , sha256(req.body.pass) ];
    // console.log(tempUserName+" " + tempPassword);
    User.findOne({ $and : [{ username : tempUserName },{ password : tempPassword }] } ,(err,doc)=>{
        if(err)
        {
            console.log("There might be some error");
            res.redirect('/');
        }
        else{
            if(doc)
            {
                const token =  doc.generateAuthTokenForLogin();

                res.cookie("jwt",token,{
                    expires : new Date(Date.now()+1800000),
                    httpOnly : true,
                });
                
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
    if(isLogin)
        res.redirect('/');
    else
        res.render('login/signup');
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
                isSigningUp = false;
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
                            const newOTP = new Otp({
                                email : curMail,
                                otp : randNumber
                            });
                            newOTP.save();
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
        res.redirect('/');
})

app.post('/otp',(req,res)=>{
    Otp.findOne( {$and: [{ email: curMail},{ otp : req.body.otp }]} , (err,doc)=>{
        if(err)
        {
            // console.log("error Otp validation");
            res.redirect("/");
        }
        else{
            if(doc)
            {  
                Otp.deleteOne({ email: curMail, otp : req.body.otp },(error)=>{
                    if(!error){
                        validated = true;
                        res.redirect('/info');
                    }
                })
            }
            else{
                alert("Invalid OTP");
                res.redirect('/otp');
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
        res.redirect('/');
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
                alert("This username already exists");
                res.redirect('/');
            }
            else{
                try {
                    const newUser = new User({
                        email : curMail,
                        username : curUsername,
                        password : curPassword ,
                        admin : 0,
                        shelf : [],
                    });
                    const token =  newUser.generateAuthToken();
                    res.cookie("jwt",token,{
                        expires : new Date(Date.now()+1800000),
                        httpOnly : true
                    });
                     newUser.save();
                    console.log("Success Part: "+ newUser);
                    res.redirect('/');
                } catch (error) {
                    console.log(error);
                }
            }
        }
    });
})

app.get('/forget' , (req,res)=>{
    if(!isLogin)
        res.render('login/forget');
    else
        res.redirect('/');
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
                    subject: 'Change Password for WCE SPACE Account',
                    text: "Hello "+ doc.username +"\nYour Temporory password for WCE SPACE Log in is: "+ String(randNumber)+
                        "\nPlease Don't Share it with anyone and We recommand you to change it ,  When"
                        +" You will log in using provided temporory password"
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

    try {
        const token = req.cookies.jwt;
        const verifyUser =  jwt.verify(token,process.env.SECRET_KEY);
        console.log(verifyUser);

        User.findById(verifyUser._id,(err,doc)=>{
            res.render('login/cpass');
        });
    } catch (error) {
        res.redirect('/');
    }     
});

app.post('/cpass',(req,res)=>{
    const curPassword = sha256(req.body.cur_pass); 
    const newPassword = sha256(req.body.new_pass); 

    console.log(newPassword);
    console.log(curUser);


    try {
        const token = req.cookies.jwt;
        const verifyUser =  jwt.verify(token,process.env.SECRET_KEY);
        console.log(verifyUser);

        User.findById(verifyUser._id,(err,curUser)=>{
            if(err)
                console.log("Error");
            else{
                if(curUser)
                {
                    User.updateOne( { username : curUser.username } , { password : newPassword } ,(error)=>{
                        if(error)
                        console.log("Error in updating");
                    });
                    alert("Your Password Has been updated");
                    res.redirect('/home');
                }
                else{
                    alert("Please Enter Correct Current Password");
                    res.redirect('/cpass');
                }
            }
        });
    } catch (error) {
        res.redirect('/');
    }     


    User.findOne({ $and : [{ username : curUser.username } , { password : curPassword }]} , (err,doc)=>{
        
    });
});

// other route 
 
// CSE books
const CSEschema = new mongoose.Schema({
    year : String,
    bookname : String,
    author : String,
    subject : String,
    imgUrl : String,
    bookUrl : String
});
// IT books
const ITschema = new mongoose.Schema({
    year : String,
    bookname : String,
    author : String,
    subject : String,
    imgUrl : String,
    bookUrl : String
});
// ELE books
const ELEschema = new mongoose.Schema({
    year : String,
    bookname : String,
    author : String,
    subject : String,
    imgUrl : String,
    bookUrl : String
});
// ELET books
const ELETschema = new mongoose.Schema({
    year : String,
    bookname : String,
    author : String,
    subject : String,
    imgUrl : String,
    bookUrl : String
});
// MECH books
const MECHschema = new mongoose.Schema({
    year : String,
    bookname : String,
    author : String,
    subject : String,
    imgUrl : String,
    bookUrl : String
});
// CIVIL books
const CIVILschema = new mongoose.Schema({
    year : String,
    bookname : String,
    author : String,
    subject : String,
    imgUrl : String,
    bookUrl : String
});



const CSE = mongoose.model("CSE", CSEschema);
const IT = mongoose.model("IT", ITschema);
const ELE = mongoose.model("ELE", ELEschema);
const ELET = mongoose.model("ELET", ELETschema);
const MECH = mongoose.model("MECH", MECHschema);
const CIVIL = mongoose.model("CIVIL", CIVILschema);




var sampleCSE = new CSE({
    year : 'fy',
    bookname : "Python",
    author : "Pavan Shinde",
    subject : "Coding",
    imgUrl : 'https://media.newstracklive.com/uploads/sports-news/cricket/Aug/14/big_thumb/msd2_5f3609e79d303.jpg',
    bookUrl : 'https://drive.google.com/file/d/1hxhUvb1FZW8dXgbIcF8JDPWAajkhuTVE/view?usp=sharing'
})
// sampleCSE.save();

// file to upload in google drive 
const filepath = path.join(__dirname,'dc.png');

async function generatePublicurl(fileid,filedata) {
    try {
        const fileId = fileid;
        await drive.permissions.create({
            fileId: fileId,
            requestBody : {
                role: 'reader',
                type: 'anyone',
            },
        });

        const result =  await drive.files.get({
            fileId: fileId,
            fields: 'webViewLink, webContentLink',
        });
        // console.log(result.data);
        if(filedata === 'myFile1')
        {
            booksstore.booklink =  result.data.webViewLink;
            Promise.all(result.data.webViewLink)
            .then(function(){booksstore.booklink =  result.data.webViewLink;})
            .catch(console.error);
        }
        if(filedata === 'myFile2'){
            booksstore.imagelink = 'https://drive.google.com/uc?export=view&id='+fileId;
            
            console.log(sampleCSE.imgUrl);
            Promise.all(booksstore.imagelink)
            .then(function(){
                Promise.all(booksstore.booklink)
                .then(function(){
                    // alert('data successfully saved. Thank You For contributing Us......'); 
                    const path = './public/books/'+filename;
                    const path1 = './public/books/'+filename1;

                    try {
                        fs.unlinkSync(path);
                        fs.unlinkSync(path1);
                        // console.log("File Deleted ")
                        //file removed
                    } catch(err) {
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
async function uploadFile(mimetype,bookname,filedata) {
    var bookname1 = 'dcbook.pdf';
    // console.log(bookname,bookname1);
    try{
        const response = await drive.files.create({
            requestBody: {
                name : bookname,
                mimeType: mimetype,
            },
            media: {
                mimeType: mimetype,
                body: fs.createReadStream('./public/books/'+bookname),
            }
        })
        var promises = response.data.id;
        if(filedata === 'myFile1')
            fille1id = response.data.id;
        if(filedata === 'myFile2')    
            file2id = response.data.id;
        // console.log(response.data.id);
        Promise.all(promises)
        .then(function() { generatePublicurl(response.data.id,filedata);console.log('File uploaded in drive creating link wait....'); })
        .catch(console.error);

    } catch (error) {
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
            fileId : fileid,
        });
        console.log(response.data, response.status);
    } catch (error) {
        console.log("error.message");        
    }
}

// deletefilr();

app.get("/contribute",function(req,res){
    try {
        const token = req.cookies.jwt;
        const verifyUser =  jwt.verify(token,process.env.SECRET_KEY);
        console.log(verifyUser);

        User.findById(verifyUser._id,(err,doc)=>{
            if(!err)
            {
                if(doc.admin === 1 )
                {
                    res.render("Other/contribute",{curUser : doc})               
                }
                else
                    res.redirect('/');
            }
        });
    } catch (error) {
        res.redirect('/');
    }    
});

app.post('/contribute', ( req , res ) => {

    
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
    if (req.files){
        // console.log(req.files);
        var file = req.files.myFile1;
        filename = file.name;
        file.mv('./public/books/'+filename,function(err){
            if(err){
                console.log(err);
            } else {
                // console.log("File Uploaded ");
                var waitTill = new Date(new Date().getTime() + 10000);
                while(waitTill > new Date()){};
                
                viewLinkbook = uploadFile(file.mimetype,filename,'myFile1');
                while(waitTill > new Date()){};
            }
        });
        var waitTill = new Date(new Date().getTime() + 2*file.size/1000000 );
        // setInterval(intervalFunc, 10000);
        while(waitTill > new Date()){}
        if(req.files.myFile2){
            var file = req.files.myFile2;
            filename1 = file.name;
            file.mv('./public/books/'+filename1,function(err){
                if(err){
                    console.log(err);
                } else {
                    // console.log("File Uploaded ");
                    waitTill = new Date(new Date().getTime() + 20000 );
                    while(waitTill > new Date()){}
                    viewLinkimage = uploadFile(file.mimetype,filename1,'myFile2');
                    while(waitTill > new Date()){}; 
                }
            });
        } else {
            fileid = '1-yxOyT4sOXSI1d-urXz9hYKhTyXPmpcm';
            waitTill = new Date(new Date().getTime() + 10000 );
            while(waitTill > new Date()){}
            generatePublicurl(fileid,'myFile2');
            booksstore.imgUrl = 'https://drive.google.com/uc?export=view&id=1-yxOyT4sOXSI1d-urXz9hYKhTyXPmpcm';
        }
    }
    var waitTill = new Date(new Date().getTime() + 3*file.size/1000000 );
    while(waitTill > new Date()){}
    res.redirect("/save");
    // console.log(filename+" File Uploaded "); 
    // console.log(filename1+" File Uploaded "); 
    // console.log(file);
});

///////////////////////////////////////////////
app.get("/save",function(req,res){
    try {
        const token = req.cookies.jwt;
        const verifyUser =  jwt.verify(token,process.env.SECRET_KEY);
        console.log(verifyUser);

        User.findById(verifyUser._id,(err,doc)=>{
            if(!err)
            {
                if(doc.admin === 1 )
                {
                    res.render("Other/save",{curUser : doc,booksstore:booksstore})               
                }
                else
                    res.redirect('/');
            }
        });
    } catch (error) {
        res.redirect('/');
    }    
});

app.post("/save", ( req , res ) => {
    if(booksstore.branch === "CSE"){
        sampleCSE = new CSE({
            year : booksstore.year,
            bookname : booksstore.bookname,
            author : booksstore.author,
            subject : booksstore.subject,
            imgUrl : booksstore.imagelink,
            bookUrl : booksstore.booklink,
        }); 
        sampleCSE.save();  
    } else {
        if(booksstore.branch === "IT"){
            sampleCSE = new IT({
                year : booksstore.year,
                bookname : booksstore.bookname,
                author : booksstore.author,
                subject : booksstore.subject,
                imgUrl : booksstore.imagelink,
                bookUrl : booksstore.booklink,
            }); 
            sampleCSE.save();  
        } else {
            if(booksstore.branch === "CIVIL"){
                sampleCSE = new CIVIL({
                    year : booksstore.year,
                    bookname : booksstore.bookname,
                    author : booksstore.author,
                    subject : booksstore.subject,
                    imgUrl : booksstore.imagelink,
                    bookUrl : booksstore.booklink,
                }); 
                sampleCSE.save();  
            } else {
                if(booksstore.branch === "MECH"){
                    sampleCSE = new MECH({
                        year : booksstore.year,
                        bookname : booksstore.bookname,
                        author : booksstore.author,
                        subject : booksstore.subject,
                        imgUrl : booksstore.imagelink,
                        bookUrl : booksstore.booklink,
                    }); 
                    sampleCSE.save();  
                } else {
                    if(booksstore.branch === "ELE"){
                        sampleCSE = new ELE({
                            year : booksstore.year,
                            bookname : booksstore.bookname,
                            author : booksstore.author,
                            subject : booksstore.subject,
                            imgUrl : booksstore.imagelink,
                            bookUrl : booksstore.booklink,
                        }); 
                        sampleCSE.save();  
                    } else {
                        if(booksstore.branch === "ELET"){
                            sampleCSE = new ELET({
                                year : booksstore.year,
                                bookname : booksstore.bookname,
                                author : booksstore.author,
                                subject : booksstore.subject,
                                imgUrl : booksstore.imagelink,
                                bookUrl : booksstore.booklink,
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
});

////////////////////////////////////////////
app.get("/resources",function(req,res){
    
    try {
        const token = req.cookies.jwt;
        const verifyUser =  jwt.verify(token,process.env.SECRET_KEY);
        console.log(verifyUser);

        User.findById(verifyUser._id,(err,doc)=>{
            if(!err)
            {
                res.render("Other/resources",{curUser : doc})
            }
        });
    } catch (error) {
        res.redirect('/');
    }    
});

app.get("/resources/:yrbr",function(req,res){

    try {
        const token = req.cookies.jwt;
        const verifyUser =  jwt.verify(token,process.env.SECRET_KEY);
        console.log(verifyUser);

        User.findById(verifyUser._id,(err,curUser)=>{
            if(!err)
            {
                let yrbr = req.params.yrbr;
        // CSE
        if( yrbr === 'fycse' )
        {
            CSE.find( { year : 'fy' } , (err,doc)=>{
                if(!err)
                {
                    if(doc)
                    {
                        res.render('Other/books',{curUser : curUser,bookinfo : doc , yrbr : yrbr});           
                    }
                }
            })
        }
        if( yrbr === 'sycse' )
        {
            CSE.find( { year : 'sy' } , (err,doc)=>{
                if(!err)
                {
                    if(doc)
                    {
                        res.render('Other/books',{curUser : curUser,bookinfo : doc , yrbr : yrbr});           
                    }
                }
            })
        }
        if( yrbr === 'tycse' )
        {
            CSE.find( { year : 'ty' } , (err,doc)=>{
                if(!err)
                {
                    if(doc)
                    {
                        res.render('Other/books',{curUser : curUser,bookinfo : doc , yrbr : yrbr});           
                    }
                }
            })
        }
        if( yrbr === 'btechcse' )
        {
            CSE.find( { year : 'btech' } , (err,doc)=>{
                if(!err)
                {
                    if(doc)
                    {
                        res.render('Other/books',{curUser : curUser,bookinfo : doc , yrbr : yrbr});           
                    }
                }
            })
        }
        // IT
        if( yrbr === 'fyit' )
        {
            IT.find( { year : 'fy' } , (err,doc)=>{
                if(!err)
                {
                    if(doc)
                    {
                        res.render('Other/books',{curUser : curUser,bookinfo : doc , yrbr : yrbr});           
                    }
                }
            })
        }
        if( yrbr === 'syit' )
        {
            IT.find( { year : 'sy' } , (err,doc)=>{
                if(!err)
                {
                    if(doc)
                    {
                        res.render('Other/books',{curUser : curUser,bookinfo : doc});           
                    }
                }
            })
        }
        if( yrbr === 'tyit' )
        {
            IT.find( { year : 'ty' } , (err,doc)=>{
                if(!err)
                {
                    if(doc)
                    {
                        res.render('Other/books',{curUser : curUser,bookinfo : doc , yrbr : yrbr});           
                    }
                }
            })
        }
        if( yrbr === 'btechit' )
        {
            IT.find( { year : 'btech' } , (err,doc)=>{
                if(!err)
                {
                    if(doc)
                    {
                        res.render('Other/books',{curUser : curUser,bookinfo : doc , yrbr : yrbr});           
                    }
                }
            })
        }
        // ELE
        if( yrbr === 'fyele' )
        {
            ELE.find( { year : 'fy' } , (err,doc)=>{
                if(!err)
                {
                    if(doc)
                    {
                        res.render('Other/books',{curUser : curUser,bookinfo : doc , yrbr : yrbr});           
                    }
                }
            })
        }
        if( yrbr === 'syele' )
        {
            ELE.find( { year : 'sy' } , (err,doc)=>{
                if(!err)
                {
                    if(doc)
                    {
                        res.render('Other/books',{curUser : curUser,bookinfo : doc});           
                    }
                }
            })
        }
        if( yrbr === 'tyele' )
        {
            ELE.find( { year : 'ty' } , (err,doc)=>{
                if(!err)
                {
                    if(doc)
                    {
                        res.render('Other/books',{curUser : curUser,bookinfo : doc , yrbr : yrbr});           
                    }
                }
            })
        }
        if( yrbr === 'btechele' )
        {
            ELE.find( { year : 'btech' } , (err,doc)=>{
                if(!err)
                {
                    if(doc)
                    {
                        res.render('Other/books',{curUser : curUser,bookinfo : doc , yrbr : yrbr});           
                    }
                }
            })
        }
        // ELET
        if( yrbr === 'fyelet' )
        {
            ELET.find( { year : 'fy' } , (err,doc)=>{
                if(!err)
                {
                    if(doc)
                    {
                        res.render('Other/books',{curUser : curUser,bookinfo : doc , yrbr : yrbr});           
                    }
                }
            })
        }
        if( yrbr === 'syelet' )
        {
            ELET.find( { year : 'sy' } , (err,doc)=>{
                if(!err)
                {
                    if(doc)
                    {
                        res.render('Other/books',{curUser : curUser,bookinfo : doc});           
                    }
                }
            })
        }
        if( yrbr === 'tyelet' )
        {
            ELET.find( { year : 'ty' } , (err,doc)=>{
                if(!err)
                {
                    if(doc)
                    {
                        res.render('Other/books',{curUser : curUser,bookinfo : doc , yrbr : yrbr});           
                    }
                }
            })
        }
        if( yrbr === 'btechelet' )
        {
            ELET.find( { year : 'btech' } , (err,doc)=>{
                if(!err)
                {
                    if(doc)
                    {
                        res.render('Other/books',{curUser : curUser,bookinfo : doc , yrbr : yrbr});           
                    }
                }
            })
        }
        // MECH
        if( yrbr === 'fymech' )
        {
            MECH.find( { year : 'fy' } , (err,doc)=>{
                if(!err)
                {
                    if(doc)
                    {
                        res.render('Other/books',{curUser : curUser,bookinfo : doc , yrbr : yrbr});           
                    }
                }
            })
        }
        if( yrbr === 'symech' )
        {
            MECH.find( { year : 'sy' } , (err,doc)=>{
                if(!err)
                {807969029
                    if(doc)
                    {
                        res.render('Other/books',{curUser : curUser,bookinfo : doc});           
                    }
                }
            })
        }
        if( yrbr === 'tymech' )
        {
            MECH.find( { year : 'ty' } , (err,doc)=>{
                if(!err)
                {
                    if(doc)
                    {
                        res.render('Other/books',{curUser : curUser,bookinfo : doc , yrbr : yrbr});           
                    }
                }
            })
        }
        if( yrbr === 'btechmech' )
        {
            MECH.find( { year : 'btech' } , (err,doc)=>{
                if(!err)
                {
                    if(doc)
                    {
                        res.render('Other/books',{curUser : curUser,bookinfo : doc , yrbr : yrbr});           
                    }
                }
            })
        }
        // CIVIL
        if( yrbr === 'fycivil' )
        {
            CIVIL.find( { year : 'fy' } , (err,doc)=>{
                if(!err)
                {
                    if(doc)
                    {
                        res.render('Other/books',{curUser : curUser,bookinfo : doc , yrbr : yrbr});           
                    }
                }
            })
        }
        if( yrbr === 'sycivil' )
        {
            CIVIL.find( { year : 'sy' } , (err,doc)=>{
                if(!err)
                {
                    if(doc)
                    {
                        res.render('Other/books',{curUser : curUser,bookinfo : doc});           
                    }
                }
            })
        }
        if( yrbr === 'tycivil' )
        {
            CIVIL.find( { year : 'ty' } , (err,doc)=>{
                if(!err)
                {
                    if(doc)
                    {
                        res.render('Other/books',{curUser : curUser,bookinfo : doc , yrbr : yrbr});           
                    }
                }
            })
        }
        if( yrbr === 'btechcivil' )
        {
            CIVIL.find( { year : 'btech' } , (err,doc)=>{
                if(!err)
                {
                    if(doc)
                    {
                        res.render('Other/books',{curUser : curUser,bookinfo : doc , yrbr : yrbr});           
                    }
                }
            })
        }
            }
        });
    } catch (error) {
        res.redirect('/');
    }    

    if(isLogin)
    {
        
    }
    
}); 

app.post("/resources/:yrbr", function(req,res){
    let yrbr = req.params.yrbr;
    var wishyrbr = req.body.wish_yrbr;
    var wishId = req.body.id;
    var wishyear = req.body.year;
    var list = { year : wishyear , id : wishId}

    let x =  CSE;
    console.log(yrbr);

    try {
        const token = req.cookies.jwt;
        const verifyUser =  jwt.verify(token,process.env.SECRET_KEY);
        console.log(verifyUser);

        User.findById(verifyUser._id,(err,curUser)=>{
            CSE.findOne({$and : [{ year : list.year },{ _id : list.id }] },(err,doc)=>{
        if(!err && doc)
        {
            let curShelf = [];
            User.findOne({username : curUser.username} , (err,result)=>{
                if(!err){
                         
                    curShelf = result.shelf;
                    let i = 0;
                      
                    for( i=0 ; i < curShelf.length ;i++){
                        if(JSON.stringify(curShelf[i]) === JSON.stringify(doc)){
                            break;
                        }
                    }
                    // console.log(curShelf.length+" "+i);
                    // Book not in shelf
                    if( i === curShelf.length ){
                        curShelf.push(doc);
                    }
                    // Book is in shelf
                    else{ 
                        curShelf.splice(i , 1);
                    }
                    User.updateOne({username : curUser.username} , { shelf : curShelf } , (err)=>{
                        if(!err){
                            // console.log("Shelf Updated Successfully");
                            res.redirect("/resources/"+yrbr);
                        }
                    });
                    User.findOne({username : curUser.username},(err,doc)=>{
                        if(!err)
                            curUser = doc;
                    })
                            
                }
            });
            
        }
            }) ;
            IT.findOne({$and : [{ year : list.year },{ _id : list.id }] },(err,doc)=>{
        if(!err && doc)
        {
            let curShelf = [];
            User.findOne({username : curUser.username} , (err,result)=>{
                if(!err){
                         
                    curShelf = result.shelf;
                    let i = 0;
                      
                    for( i=0 ; i < curShelf.length ;i++){
                        if(JSON.stringify(curShelf[i]) === JSON.stringify(doc)){
                            break;
                        }
                    }
                    console.log(curShelf.length+" "+i);
                    // Book not in shelf
                    if( i === curShelf.length ){
                        curShelf.push(doc);
                    }
                    // Book is in shelf
                    else{ 
                        curShelf.splice(i , 1);
                    }
                    User.updateOne({username : curUser.username} , { shelf : curShelf } , (err)=>{
                        if(!err){
                            console.log("Shelf Updated Successfully");
                            res.redirect("/resources/"+yrbr);
                        }
                    });
                    User.findOne({username : curUser.username},(err,doc)=>{
                        if(!err)
                            curUser = doc;
                    })
                            
                }
            });
            
        }
            }) ;
        });
    } catch (error) {
        res.redirect('/');
    }     
    

    
});

app.get('/shelf',(req,res)=>{

    try {
        const token = req.cookies.jwt;
        const verifyUser =  jwt.verify(token,process.env.SECRET_KEY);
        console.log(verifyUser);

        User.findById(verifyUser._id,(err,doc)=>{
            if(!err)
            {
                if(!err){
                    curShelf = doc.shelf;
                    console.log(curUser.shelf.length);
                }
                res.render('Other/shelf', {bookinfo : curShelf , curUser : doc});
            }
        });
    } catch (error) {
        res.redirect('/');
    } 
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 5000;
}

app.listen(port, function(){
    console.log("server has started Successfully");
});