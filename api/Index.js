//EXPRESS APP

const express = require('express');
const cors = require('cors');
require('dotenv').config()
const mongoose = require('mongoose');
const User = require('./models/User');
const Place = require('./models/Places.js');
const Booking = require('./models/Bookings.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();
const cookieParser = require('cookie-parser');
const imageDownloader = require('image-downloader');
const multer = require('multer');
const fs = require('fs');

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = 'thisIsOneSecretkey';

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname+'/uploads'));
app.use(cors({      //connecting the two api
    credentials: true,
    origin: 'http://localhost:5173',
}));

// console.log(process.env.MONGO_URL)
mongoose.connect(process.env.MONGO_URL); //connecting with the database

app.get('/test', (req,res)=>{
    res.json('test ok')
});


//register api endpoint
app.post('/register', async (req,res)=>{  
    const {name,email,password} = req.body;
    
    try {
        const user = await User.create({
            name,
            email,
            password:bcrypt.hashSync(password, bcryptSalt),
        });
        res.json(user);
        
    } catch (e) {
        res.status(422).json(e);
    }
});

//login api endpoint
app.post('/login', async (req,res) => {
  mongoose.connect(process.env.MONGO_URL);
  const {email,password} = req.body;
  const user1 = await User.findOne({email});
  if (user1) {
    const passOk = bcrypt.compareSync(password, user1.password);
    if (passOk) {
      jwt.sign({
        email:user1.email,
        id:user1._id
      }, jwtSecret, {}, (err,token) => {
        if (err) throw err;
        res.cookie('token', token).json(user1);
      });
    } else {
      res.status(422).json('pass not ok');
    }
  } else {
    res.json('not found');
  }
});

//profile api endpoit
app.get('/profile', (req,res) => {
    //mongoose.connect(process.env.MONGO_URL);
    const {token} = req.cookies;
    if (token) {
      jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if (err) throw err;
        const {name,email,_id} = await User.findById(userData.id);
        res.json({name,email,_id});
      });
    } else {
      res.json(null);
    }
  });

//logout api endpoint
app.post('/logout', (req,res)=> {
    res.cookie('token', '').json(true);
});

//Uploading image by link api endpoint
app.post('/upload-by-link', async (req,res) => {
  const {link} = req.body;
  const newName = 'photo' + Date.now() + '.jpg';
  await imageDownloader.image({
    url: link,
    dest: __dirname + '/uploads/' +newName,
  });
  // const url = await uploadToS3('/tmp/' +newName, newName, mime.lookup('/tmp/' +newName));
  // res.json(url);
  res.json(newName);
});

//upload from local api endpoint
const photosMiddleware = multer({dest:'uploads/'});
app.post('/uploads', photosMiddleware.array('photos', 100), async (req,res) => {
  const uploadedFiles = [];
  for (let i = 0; i < req.files.length; i++) {
    const {path,originalname} = req.files[i];
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    const newPath = path + '.' + ext;
    fs.renameSync(path,newPath);
    uploadedFiles.push(newPath.replace('uploads/',''));
  }
  res.json(uploadedFiles);
});

//api endpoint for adding New Places
app.post('/places', (req,res) => {
  debugger
  //mongoose.connect(process.env.MONGO_URL);
  const {token} = req.cookies;
  const {
    title,address,addedPhotos,description,price,
    perks,extraInfo,checkIn,checkOut,maxGuests,
  } = req.body;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) throw err;
    const placeDoc = await Place.create({
      owner:userData.id,price,
      title,address,photos:addedPhotos,description,
      perks,extraInfo,checkIn,checkOut,maxGuests,price
    });
    res.json(placeDoc);
  });
});

//api endpoint for getting the places for a user
app.get('/user-places', (req,res) => {
  const {token} = req.cookies;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    const {id} = userData;
    res.json(await Place.find({owner:id}));
  });
})

//api endpoint for getting all the places
app.get('/places', async (req,res) => {
  res.json( await Place.find());
})

app.get('/places/:id', async (req,res) => {
  //mongoose.connect(process.env.MONGO_URL);
  const {id} = req.params;
  res.json(await Place.findById(id));
});

app.put('/places', async (req,res) => {
  
  const {token} = req.cookies;
  const {
    id,title,address,addedPhotos,description,price,
    perks,extraInfo,checkIn,checkOut,maxGuests,
  } = req.body;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if(err) throw err;
    const placeDoc = await Place.findById(id);
    if(userData.id === placeDoc.owner.toString()){
      placeDoc.set({
        title,address,photos:addedPhotos,description,price,
        perks,extraInfo,checkIn,checkOut,maxGuests
      });
      await placeDoc.save();
      res.json('ok');
    }
  });
})

//api endpoint for booking the place
app.post('/bookings', async (req, res) => {
  //mongoose.connect(process.env.MONGO_URL);
  const userData = await getUserDataFromReq(req);
  const {
    place,checkIn,checkOut,numberOfGuests,name,phone,price,
  } = req.body;
  Booking.create({
    place,checkIn,checkOut,numberOfGuests,name,phone,price,
    user:userData.id,
  }).then((doc) => {
    res.json(doc);
  }).catch((err) => {
    throw err;
  });
});

function getUserDataFromReq(req) {
  return new Promise((resolve, reject) => {
    jwt.verify(req.cookies.token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      resolve(userData);
    });
  });
}

//api endpoint for getting the bookins
app.get('/bookings', async (req,res) => {
  const {token} = req.cookies;
  const userData = await getUserDataFromReq(req);
  res.json( await Booking.find({user:userData.id}).populate('place') );
});



app.listen(4001); //port

//bookings-pass:
//R4jtHJGykcNPaQAi