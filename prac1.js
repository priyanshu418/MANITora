const express=require('express');
const app=express();
const ejs=require('ejs');
const bodyParser=require('body-parser');
const session=require('express-session');
const mongoose=require('mongoose');
const passport=require('passport');
const passportLocalMongoose=require('passport-local-mongoose');
mongoose.set('useCreateIndex', true);

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine','ejs');

app.use(session({                                               // PP
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/newDB',{useNewUrlParser:true,useUnifiedTopology:true});

const userSchema=new mongoose.Schema({
  username:String,
  name:String,
  branch:String,
  year:String,
  college:String,
  password:String
});

userSchema.plugin(passportLocalMongoose);
const User=mongoose.model('User',userSchema);

const questAndAnswerSchema=new mongoose.Schema({
  email:String,
  quest:String,
  postedBy: userSchema,
  answer:[{
    answer:String,
    name:String
  }],
  likes:Number,
  views:Number
});

const Question=mongoose.model("Question",questAndAnswerSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

app.get('/',function(req,res){
  var isauth=0;
  var currUser;
  if(req.isAuthenticated()){
    isauth=1;
    currUser=req.user;
  }
  res.render('home',{isauth:isauth,currUser:currUser});
});

app.get('/login',function(req,res){
  var isauth=0;
  var currUser;
  if(req.isAuthenticated()){
    isauth=1;
    currUser=req.user;
  }
  res.render('login',{isauth:isauth,currUser:currUser});
});

app.post('/login',function(req,res){
  const user=new User({
    username:req.body.username,
    password:req.body.password
  });
  req.login(user,function(err){
    if(err){
      console.log(err);
      res.redirect('/login');
    }else{
      passport.authenticate('local')(req,res,function(){
        res.redirect('/discussion');
      });
    }
  });
});

app.get('/discussion',function(req,res){
  var isauth=0;
  var currUser;
  if(req.isAuthenticated()){
    isauth=1;
    currUser=req.user;
    Question.find({},function(err,questions){
      if(err){
        console.log(err);
      }else{
        res.render('discussion',{questions:questions,isauth:isauth,currUser:currUser});
      }
    });
  }else{
    res.redirect('/login');
  }
});

app.get('/ask',function(req,res){
  var isauth=0;
  var currUser;
  if(req.isAuthenticated()){
    isauth=1;
    currUser=req.user;
    res.render('ask',{isauth:isauth,currUser:currUser});
  }else{
    res.redirect('/login');
  }
});

app.post('/ask',function(req,res){
  var user=req.user;
  var isauth=1;
  const que=new Question({
    quest:req.body.quest,
    postedBy: user,
    likes:0,
    views:1
  });
  que.save();
  res.redirect('/discussion');
});

app.get('/signup',function(req,res){
  var isauth=0;
  var currUser;
  if(req.isAuthenticated()){
    isauth=1;
    currUser=req.user;
  }
  res.render('signup',{isauth:isauth,currUser:currUser});
});

app.get('/answers/:questionId',function(req,res){
    var isauth=0;
    var user;
    if(req.isAuthenticated()){
      isauth=1;
      user=req.user;
      const qid=req.params.questionId;
      Question.findById(qid,function(err,question){
        if(err){
          console.log(err);
        }else{
          question.views=question.views+1;
          question.save();
          res.render('answers',{isauth:isauth,currUser:user,question:question});
        }
      });
    }else{
      res.redirect('/login');
    }

});

app.get('/likes/:questionId',function(req,res){
  const reqId=req.params.questionId;
  Question.findById(reqId,function(err,question){
    question.likes=question.likes+1;
    question.save();
    res.redirect('/discussion');
  });
});

app.post('/signup',function(req,res){
  User.register({
    username:req.body.username,
    name:req.body.name,
    branch:req.body.branch,
    year:req.body.year,
    college:req.body.college
  },req.body.password,function(err,user){
    if(err){
      console.log(err);
      res.redirect('/signup');
    }
    else{
      passport.authenticate('local')(req,res,function(){
        res.redirect('/discussion');
      });
    }
  });
});

app.get('/logout',function(req,res){
  req.logout();
  res.redirect('/');
});

app.listen(3000,function(req,res){
  console.log("Server is running at port 3000...");
});
