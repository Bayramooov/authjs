const express = require('express');
const crypto = require('crypto');
const { promisify } = require('util');

const app = express();
const port = 4100;
const scrypt = promisify(crypto.scrypt);

app.set('view-engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(require('./parse-cookie'));
app.use(require('./auth.js'));

let users = [];

////////////////////////////////////////////////// Dashboard
app.get('/', (req, res) => {
  res.render('index.ejs', {
    users: JSON.stringify(users, false, 4),
    cookie: JSON.stringify(req.cookies, false, 4)
  });
});

////////////////////////////////////////////////// Registration
app.get('/register', (req, res) => {
  res.render('register.ejs');
});

app.post('/register', async (req, res) => {
  let salt = crypto.randomBytes(16).toString('hex');
  try {
    var passwordHash = await scrypt(req.body.password, salt, 64);
  } catch (err) {
    console.error(err);
    res.redirect('/register');
  }
  users.push({
    id: Date.now().toString(),
    name: req.body.name,
    email: req.body.email,
    password: salt + ':' + passwordHash.toString('hex')
  });
  console.log(users);
  res.redirect('/');
});

////////////////////////////////////////////////// Logging in
app.get('/login', (req, res) => {
  res.setHeader('set-cookie', 'name=Sardor Bayramov'); // TODO
  res.render('login.ejs');
});

app.post('/login', async (req, res) => {
  const user = users.find(user => user.email === req.body.email);
  if (user == null) {
    console.log('user email not found, email:', req.body.email);
    return res.redirect('/login');
  }
  let [salt, oldPasswordHash] = user.password.split(':');
  oldPasswordHash = Buffer.from(oldPasswordHash, 'hex');
  try {
    var passwordHash = await scrypt(req.body.password, salt, 64);
  } catch (err) {
    console.error(err);
    res.redirect('/login');
  }
  if (crypto.timingSafeEqual(oldPasswordHash, passwordHash)) {
    console.log(users);
    res.redirect('/');
  } else {
    console.log('wrong password');
    res.setHeader('set-cookie', 'a=1');
    res.redirect('/login');
  }
});

////////////////////////////////////////////////// Application start
app.listen(port, () => console.log('Server listening on port:', port));
