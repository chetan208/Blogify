const {Router}=require('express');
const multer  = require('multer');
const path= require('path');
const Blog=require("../models/blog.js");
const Comment=require("../models/comment");
const fs = require("fs");

const router=Router();

const uploadPath = process.env.NODE_ENV === "production"
                   ? "/tmp/uploads" 
                   : path.join(__dirname, "../public/uploads");

// Make folder if it doesn’t exist
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

try {
  fs.chmodSync(uploadPath, 0o777);  // give full permission
} catch (err) {
  console.error("Error creating upload folder:", err);
}

// Multer storage setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }
 });



router.get('/add-new',(req,res)=>{
    return res.render('addBlog',{
        user:req.user,
    })
})

router.get("/", (req, res) => {
    return res.redirect("/blog/add-new");
});

router.get("/:id",async(req,res)=>{
  const blog=await Blog.findById(req.params.id).populate("createdBy");
  const comments=await Comment.find({blogId:req.params.id}).populate("createdBy");
  return res.render("blog",{
    user:req.user,
    blog,
    comments,
  });
});

router.post("/", upload.single('coverImage'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("File not uploaded");

    const { title, body } = req.body;

    const blog = await Blog.create({
      title,
      body,
      createdBy: req.user._id,
      coverImageURL: `/uploads/${req.file.filename}`, // safe now
    });

    res.redirect(`/blog/${blog._id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

router.post('/comment/:blogId',async(req,res)=>{
  await Comment.create({
    content:req.body.content,
    blogId:req.params.blogId,
    createdBy:req.user._id,
  });

  return res.redirect(`/blog/${req.params.blogId}`);
});
  

module.exports=router;