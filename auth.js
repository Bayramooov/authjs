const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const verify = promisify(jwt.verify);

async function verify_user(token) {
  if (token == null) throw 'no access_token provided';
  try {
    return await verify(token, 'techieland');
  } catch {
    throw 'invalid access_token';
  }
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
