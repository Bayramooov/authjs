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
  ) throw new Error('not enougt credentials');

  try {
    var passwordHash = await scrypt(req.body.password, 'techieland', 64);
    passwordHash = passwordHash.toString('hex');
  } catch (err) {
    throw err;
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
    throw new Error(`user not found, email: ${email}`);
  }
  try {
    var passwordHash = await scrypt(password, 'techieland', 64);
  } catch (err) {
    throw err;
  }
  const oldPasswordHash = Buffer.from(user.password, 'hex');
  if (!crypto.timingSafeEqual(oldPasswordHash, passwordHash)) {
    throw new Error('wrong password');
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
    password: 'd99853fd8d04c690e46968f893adcd3a:d40715fa483aa61053d8c026f4ae511e7b59fe55ec02cd1861d386f1d60bd31a2262c4c0aecf50d50e96495efce90f0d4a6094c3888ef6eca1179472ad3bfbbb'
  }
];

////////////////////////////////////////////////// Dashboard
app.get('/', (req, res) => {
  res.render('index.ejs', {
    cookie: JSON.stringify(req.cookies, false, 4),
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

  const access_token = sign(user);
  console.log('access_token', access_token);

  res.setHeader('set-cookie', `access_token=${access_token}`);
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
