const { ZodError } = require('zod');

/**
 * Middleware factory — validates req.body against a Zod schema.
 * On failure: 400 with field-level error messages.
 * On success: attaches req.validatedBody and calls next().
 */
const validateBody = (schema) => (req, res, next) => {
  try {
    req.validatedBody = schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const fields = {};
      err.errors.forEach((e) => {
        const key = e.path.join('.');
        fields[key] = e.message;
      });
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', fields },
      });
    }
    next(err);
  }
};

module.exports = { validateBody };
