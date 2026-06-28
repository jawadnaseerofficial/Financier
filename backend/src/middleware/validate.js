import { AppError } from './errorHandler.js';

export const parseQueryParams = (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
  const offset = (page - 1) * limit;
  const sort = req.query.sort || 'id';
  const order = req.query.order === 'asc' ? 'ASC' : 'DESC';

  req.pagination = { page, limit, offset, sort, order };
  next();
};

const validators = {
  required: (value) => value !== undefined && value !== null && value !== '',
  minLength: (value, min) => !value || String(value).length >= min,
  maxLength: (value, max) => !value || String(value).length <= max,
  min: (value, min) => value === undefined || value === null || Number(value) >= min,
  max: (value, max) => value === undefined || value === null || Number(value) <= max,
  type: (value, type) => {
    if (value === undefined || value === null || value === '') return true;
    switch (type) {
      case 'number': return !isNaN(Number(value));
      case 'email': return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
      case 'date': return !isNaN(Date.parse(value));
      case 'boolean': return typeof value === 'boolean' || value === 'true' || value === 'false';
      default: return true;
    }
  },
  oneOf: (value, allowed) => !value || allowed.includes(value),
  pattern: (value, regex) => !value || regex.test(String(value)),
};

export const validate = (schema) => (req, res, next) => {
  const errors = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = req.body[field];

    for (const [rule, param] of Object.entries(rules)) {
      const validator = validators[rule];
      if (validator && !validator(value, param)) {
        errors.push(`${field}: ${rule} failed${param !== true ? ` (${param})` : ''}`);
      }
    }
  }

  if (errors.length > 0) {
    return next(new AppError(`Validation failed: ${errors.join('; ')}`, 400));
  }

  next();
};
