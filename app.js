const express = require("express");

const bodyparser = require("body-parser");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyparser.urlencoded({extended:true}));
app.use(express.static("public"));

app.get("/",function(req,res){
    res.render("home")
}); 

app.get("/contribute",function(req,res){
    res.render("contribute")
}); 

app.get("/resources",function(req,res){
    res.render("resources")
});

app.get("/books",function(req,res){
    res.render("books")
}); 

// app.post("/", function(req,res){
//     var item = req.body.newItem;
//     items.push(item);
//     res.redirect("/")
//     console.log(item);
// })

app.listen(3000 , function(){
    console.log("Server Started on port 3000");
})