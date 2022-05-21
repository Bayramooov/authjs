const express = require('express');
const { timingSafeEqual, scryptSync } = require('crypto');
const jwt = require('jsonwebtoken');
const app = express();
const port = 443;

function create_user(payload) {
  if (
    !payload.name ||
    !payload.email ||
    !payload.password
  ) throw new Error('not enougt credentials');
  let passwordHash = scryptSync(payload.password, 'techieland', 64).toString('hex');
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

function verify(email, password) {
  const user = users.find(user => user.email === email);
  if (user == null) {
    throw new Error(`user not found, email: ${email}`);
  }
  const oldPasswordHash = Buffer.from(user.password, 'hex');
  const passwordHash = scryptSync(password, 'techieland', 64);
  if (!timingSafeEqual(oldPasswordHash, passwordHash)) {
    throw new Error('wrong password');
  }
  return sign(user);
}

app.set('view-engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
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
    me: JSON.stringify(users.find(u => u.id === req.user.id), false, 4),
    users: JSON.stringify(users.map(u => u.name), false, 4)
  });
});

////////////////////////////////////////////////// Registration
app.get('/register', (req, res) => {
  res.render('register.ejs');
});

app.post('/register', (req, res) => {
  try {
    var user = create_user(req.body);
    users.push(user);
  } catch (err) {
    console.error(err);
    res.setHeader('set-cookie', `access_token=-1; Max-Age=-1`);
    res.setHeader('set-cookie', `error_message=${err}; Max-Age=60`);
    return res.redirect('/register');
  }
  res.setHeader('set-cookie', `access_token=${sign(user)}; Max-Age=60`);
  return res.redirect('/');
});

////////////////////////////////////////////////// Logging in
app.get('/login', (req, res) => {
  res.render('login.ejs');
});

app.post('/login', (req, res) => {
  try {
    var access_token = verify(req.body.email, req.body.password);
  } catch (err) {
    console.error(err);
    res.setHeader('set-cookie', 'access_token=-1; Max-Age=-1');
    res.setHeader('set-cookie', `error_message=${err}; Max-Age=60`);
    return res.redirect('/login');
  }
  res.setHeader('set-cookie', `access_token=${access_token}; Max-Age=60`);
  return res.redirect('/');
});

////////////////////////////////////////////////// Application start
app.get('/logout', (req, res) => {
  res.setHeader('set-cookie', 'access_token=-1; Max-Age=-1');
  return res.redirect('/login');
});

////////////////////////////////////////////////// Application start
app.listen(port, () => console.log('Server listening on port:', port));
