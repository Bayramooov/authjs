const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const app = express();
const port = 4100;
const scrypt = promisify(crypto.scrypt);

async function create_user(payload) {
  if (
    !payload.name ||
    !payload.email ||
    !payload.password
  ) return Promise.reject('not enougt credentials');

  try {
    var passwordHash = await scrypt(payload.password, 'techieland', 64);
    passwordHash = passwordHash.toString('hex');
  } catch (err) {
    return Promise.reject(err);
  }

  return {
    id: Date.now().toString(),
    name: payload.name,
    email: payload.email,
    password: passwordHash
  };
}

function sign(user) {
  return jwt.sign(user, 'techieland');
}

async function verify(email, password) {
  const user = users.find(user => user.email === email);
  if (user == null) {
    return Promise.reject(`user not found, email: ${email}`);
  }
  try {
    var passwordHash = await scrypt(password, 'techieland', 64);
  } catch (err) {
    return Promise.reject(err);
  }
  const oldPasswordHash = Buffer.from(user.password, 'hex');
  if (!crypto.timingSafeEqual(oldPasswordHash, passwordHash)) {
    return Promise.reject('wrong password');
  }
  return sign(user);
}

app.set('view-engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(require('./parse-cookie'));
app.use(require('./auth.js'));

let users = [
  {
    id: 1,
    name: 'Sardor Bayramov',
    email: 'Sardor@techie.com',
    // password: 1,
    password: 'f7cc218a5e35f3c1cc02791af8d77f438944c7a2f4de525d4f1222e6b73b327336b86630600b67bb74ba1235c13eeea369f966990371602373fc6bae8c91eb87'
  }
];

////////////////////////////////////////////////// Dashboard
app.get('/', (req, res) => {
  res.render('index.ejs', {
    user: JSON.stringify(users.find(u => u.id === req.user.id), false, 4)
  });
});

////////////////////////////////////////////////// Registration
app.get('/register', (req, res) => {
  res.render('register.ejs');
});

app.post('/register', async (req, res) => {
  try {
    var user = await create_user(req.body);
    users.push(user);
  } catch (err) {
    console.error(err);
    res.setHeader('set-cookie', `access_token=-1; Max-Age=-1`);
    return res.redirect('/register');
  }
  res.setHeader('set-cookie', `access_token=${sign(user)}`);
  return res.redirect('/');
});

////////////////////////////////////////////////// Logging in
app.get('/login', (req, res) => {
  res.render('login.ejs');
});

app.post('/login', async (req, res) => {
  try {
    var access_token = await verify(req.body.email, req.body.password);
  } catch (err) {
    console.error(err);
    res.setHeader('set-cookie', 'access_token=-1; Max-Age=-1');
    return res.redirect('/login');
  }
  res.setHeader('set-cookie', `access_token=${access_token}`);
  return res.redirect('/');
});

////////////////////////////////////////////////// Application start
app.get('/logout', (req, res) => {
  res.setHeader('set-cookie', 'access_token=-1; Max-Age=-1');
  return res.redirect('/login');
});

////////////////////////////////////////////////// Application start
app.listen(port, () => console.log('Server listening on port:', port));
