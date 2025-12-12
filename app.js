require("dotenv").config();
const express=require('express');
const path=require('path');
const mongoose=require("mongoose");
const cookieParser=require("cookie-parser");
const {checkForAuthenticationCookie}=require('./middelwares/authentication')

const Blog=require("./models/blog");

const userRoute=require('./routes/user');
const blogRoute=require('./routes/blog');

const app=express();
const PORT=process.env.PORT;

mongoose.connect(process.env.MONGO_URL)
.then(e=> console.log("mongoDB is connected"));

app.use(express.urlencoded({extended:false}));
app.use(cookieParser());
app.use(checkForAuthenticationCookie("token"));
app.use('/images', express.static('public/images'));

if (process.env.NODE_ENV !== "production") {
  app.use('/uploads', express.static(path.join(__dirname, "public/uploads")));
} else {
  app.use('/uploads', express.static('/tmp/uploads'));
}



app.set("view engine","ejs");
app.set("views",path.resolve("./views"));

app.get("/",async (req,res)=>{
    const allBlogs =await(await Blog.find({}));
    res.render("home",{
        user:req.user,
        blogs:allBlogs,
    });
});

app.use("/users",userRoute);
app.use("/blog",blogRoute);

app.listen(PORT,()=>{console.log(`Server is running on http://localhost:${PORT}`);});

