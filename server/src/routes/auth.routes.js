const express = require('express');
const router = express.Router();
const { register, login, me } = require('../controllers/auth.controller');
const protect = require('../middleware/protect');
const { validateBody } = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../schemas/auth.schema');

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.get('/me', protect, me);

module.exports = router;
