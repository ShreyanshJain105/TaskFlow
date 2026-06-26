const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { message: 'No token provided' },
    });
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    const message = err.name === 'TokenExpiredError'
      ? 'Token expired, please sign in again'
      : 'Invalid token';
    return res.status(401).json({ success: false, error: { message } });
  }

  try {
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Account not found' },
      });
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = protect;
