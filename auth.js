const jwt = require('jsonwebtoken');

function verify_user(token) {
  return new Promise((res, rej) => {
    if (token == null) rej('no access_token provided');
    jwt.verify(token, 'techieland', (err, user) => {
      if (err) rej('invalid access_token');
      return res(user);
    });
  });
}

module.exports = async (req, res, next) => {
  try {
    var user = await verify_user(req.cookies.access_token);
    var has_token = true;
  } catch (err) {
    console.error(err);
    has_token = false;
  }
  let uri_auth = ['/login', '/register'].includes(req.url);
  if (!has_token) {
    if (!uri_auth) return res.redirect('/login');
    else return next();
  }
  req.user = user;
  if (!uri_auth) return next();
  else return res.redirect('/');
}
