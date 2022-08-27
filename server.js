'use strict';
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');

// variables
const PORT = process.env.PORT;
const sessionConfig={
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}

// create and configure server
const app = express(); // create server (express app)
app.use(bodyParser.json()); // to parse and read json object inside the request
app.use(session(sessionConfig)); // to create a session
app.use(express.static(path.join(__dirname,'public'))); // to serve static files for client side
app.set('view engine','ejs'); // to parse ejs files
app.set('views',path.join(__dirname,'views')) // to set the ejs files location
app.listen(PORT,err => { // to use a port for the server app
    if(err){
        console.log(err);
    }else{
        console.log('server started');
    }
})

// import routes
const mainRouter = require('./routes/mainRoute');

// use middleware routes
app.use('/',mainRouter);