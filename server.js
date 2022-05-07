const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

const app = express();
const port = 4100;
const scrypt = promisify(crypto.scrypt);

app.set('view-engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(require('./parse-cookie'));
app.use(require('./auth.js'));

let users = [
  {
    id: 1,
    name: 'Sardor Bayramov',
    email: 'Sardor@techie.com',
    password: 'd99853fd8d04c690e46968f893adcd3a:d40715fa483aa61053d8c026f4ae511e7b59fe55ec02cd1861d386f1d60bd31a2262c4c0aecf50d50e96495efce90f0d4a6094c3888ef6eca1179472ad3bfbbb'
  }
];

////////////////////////////////////////////////// Dashboard
app.get('/', (req, res) => {
  res.render('index.ejs', {
    cookie: JSON.stringify(req.cookies, false, 4),
    user: JSON.stringify(users, false, 4)
  });
});

////////////////////////////////////////////////// Registration
app.get('/register', (req, res) => {
  res.render('register.ejs');
});

app.post('/register', async (req, res) => {
  try {
    var passwordHash = await scrypt(req.body.password, 'techieland', 64);
  } catch (err) {
    console.error(err);
    res.redirect('/register');
  }

  const access_token = passwordHash.toString('hex');

  users.push({
    id: Date.now().toString(),
    name: req.body.name,
    email: req.body.email,
    password: access_token
  });

  res.setHeader('set-cookie', `access_token=${access_token}`);
  return res.redirect('/');
});

////////////////////////////////////////////////// Logging in
app.get('/login', (req, res) => {
  res.render('login.ejs');
});

app.post('/login', async (req, res) => {
  const user = users.find(user => user.email === req.body.email);
  
  if (user == null) {
    console.log('user email not found, email:', req.body.email);
    return res.redirect('/login');
  }

  let oldPasswordHash = Buffer.from(user.password, 'hex');

  try {
    var passwordHash = await scrypt(req.body.password, 'techieland', 64);
  } catch (err) {
    console.error(err);
    res.redirect('/login');
  }

  console.log(oldPasswordHash, passwordHash);
  
  if (crypto.timingSafeEqual(oldPasswordHash, passwordHash)) {
    console.log(user);

    let access_token = jwt.sign(user, 'techieland');

    res.setHeader('set-cookie', `access_token=${access_token}`);
    return res.redirect('/');
  } else {
    console.log('wrong password');
    res.setHeader('set-cookie', 'access_token=-1');
    return res.redirect('/login');
  }
});

////////////////////////////////////////////////// Application start
app.get('/logout', (req, res) => {
  res.setHeader('set-cookie', 'access_token=-1');
  res.redirect('/login');
});

////////////////////////////////////////////////// Application start
app.listen(port, () => console.log('Server listening on port:', port));
