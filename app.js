/**
 * Created by muna on 4/1/17.
 */
let express = require ('express');
let handlebars = require('express-handlebars');
let app = express ();
let router = require('./routes');
let cookie = require('cookie-parser');

let body_parser= require('body-parser');
let session = require('express-session');

app.use(session({secret: 'mysecret',
    cookie: {maxAge: 30*60*1000 },
    resave: false,
    saveUninitialized : false
}));
app.use(cookie());
app.use(body_parser.json());
app.use(body_parser.urlencoded({extended:true}));
app.use(express.static(__dirname));
app.engine('hbs',handlebars({defaultLayout:'template',extname: '.hbs'}));
app.set('view engine','hbs');
app.set('/views',__dirname+'/views');
app.use('/',router);


//repo.connect();
let port = 3000;
let host = "localhost";


app.listen(port,()=> {
    console.log(`attendance server is started at ${host}:${port}`);
})


