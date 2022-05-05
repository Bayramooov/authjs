module.exports = (req, res, next) => {
  let cookies = req.headers.cookie && req.headers.cookie.split('; ') || [];
  req.cookies = {};
  cookies.forEach(c => {
    [key, value] = c.split('=');
    req.cookies[key] = value;
  });
  next();
}
