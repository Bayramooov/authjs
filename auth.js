const jwt = require('jsonwebtoken');

function verify_user(token) {
  return new Promise((res, rej) => {
    if (token == null) return rej(false);
    jwt.verify(token, 'techieland', (err, user) => {
      if (err) return rej(false);
      return res(true);
    });
  });
}

module.exports = async (req, res, next) => {
  console.log(req.cookies.access_token);
  try {
    var is_auth = await verify_user(req.cookies.access_token);
  } catch (err) {
    is_auth = false;
  }

  let routes = ['/login', '/register'];
  let is_login = routes.includes(req.url);

  if (!is_auth && !is_login) return res.redirect('/login');
  else if (!is_auth && is_login) return next();
  else if (is_auth && !is_login) return next();
  else if (is_auth && is_login) return res.redirect('/');
}
