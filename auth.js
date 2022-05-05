module.exports = (req, res, next) => {
  if (req.url === '/login') next();

  const token = req.cookies.access_token;
  if (token == null) return res.redirect('/login');

  jwt.verify(token, 'techieland', (err, user) => {
    if (err) res.redirect('/login');
    req.user = user;
    if (['/login', '/register'].includes(req.url)) return res.redirect('/');
    next();
  });
}
