/**
 * Validate request has required fields
 * 
 * What: Check if request body has required properties
 * When: Applied to routes that need specific fields
 * Why: Prevent incomplete/invalid data from reaching controllers
 * How: Check fields, return 400 error if missing
 */
export const validateRequired = (fields) => {
  return (req, res, next) => {
    const missingFields = fields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Validate post content length
 */
export const validatePostLength = (req, res, next) => {
  const maxLength = 5000;
  const { content } = req.body;

  if (content && content.length > maxLength) {
    return res.status(400).json({
      error: `Post exceeds maximum length of ${maxLength} characters`
    });
  }

  next();
};

/**
 * Validate email format
 */
export const validateEmail = (req, res, next) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const { email } = req.body;

  if (email && !emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  next();
};

/**
 * Validate MongoDB ObjectId
 */
export const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        error: `Invalid ${paramName} format` 
      });
    }

    next();
  };
};