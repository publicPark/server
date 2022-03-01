const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
let envpath = '.env' + (process.env.NODE_ENV? `.${process.env.NODE_ENV}` : '');
require('dotenv').config({ path: path.resolve(__dirname, envpath) });


// import routes
const authRoute = require('./routes/auth');

// connct to db
mongoose.connect(process.env.DB_URL, {
}, () => console.log('connected to db'));

// middleware
app.use(express.json())

// routes
app.use('/api/user', authRoute);

app.listen(process.env.PORT,
  () => console.log(process.env.NODE_ENV + ' server starts at', process.env.PORT)
);