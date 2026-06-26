const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken } = require('../utils/jwt');

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.validatedBody;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: { message: 'Email already in use', fields: { email: 'Email already in use' } },
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });
    const token = signToken(user._id);

    res.status(201).json({ success: true, data: { token, user } });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.validatedBody;

    // select('+passwordHash') overrides the schema's default exclusion so we can compare
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid email or password' },
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid email or password' },
      });
    }

    const token = signToken(user._id);
    res.json({ success: true, data: { token, user } });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me — returns the user already attached by the protect middleware
const me = async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
};

module.exports = { register, login, me };
