module.exports = function secureHeaders() {
  return function (req, res, next) {
    res.setHeader("X-Frame-Options", "sameorigin");
    next();
  };
};
