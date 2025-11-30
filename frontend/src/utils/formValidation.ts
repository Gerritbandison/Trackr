/**
 * Comprehensive form validation utilities
 */

export const validators = {
  required: (value) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return 'This field is required';
    }
    return null;
  },

  email: (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },

  minLength: (min) => (value) => {
    if (!value) return null;
    if (value.length < min) {
      return `Must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (max) => (value) => {
    if (!value) return null;
    if (value.length > max) {
      return `Must be at most ${max} characters`;
    }
    return null;
  },

  numeric: (value) => {
    if (!value) return null;
    if (isNaN(value)) {
      return 'Must be a number';
    }
    return null;
  },

  positive: (value) => {
    if (!value) return null;
    if (parseFloat(value) <= 0) {
      return 'Must be a positive number';
    }
    return null;
  },

  url: (value) => {
    if (!value) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return 'Please enter a valid URL';
    }
  },

  pattern: (regex, message) => (value) => {
    if (!value) return null;
    if (!regex.test(value)) {
      return message || 'Invalid format';
    }
    return null;
  },

  custom: (fn) => (value) => {
    return fn(value);
  },
};

export const validateField = (value, rules) => {
  for (const rule of rules) {
    const error = rule(value);
    if (error) return error;
  }
  return null;
};

export const validateForm = (formData, schema) => {
  const errors = {};
  let isValid = true;

  for (const [field, rules] of Object.entries(schema)) {
    const value = formData[field];
    const error = validateField(value, rules);
    
    if (error) {
      errors[field] = error;
      isValid = false;
    }
  }

  return { errors, isValid };
};

// Common validation schemas
export const schemas = {
  asset: {
    name: [validators.required, validators.minLength(2)],
    category: [validators.required],
    manufacturer: [validators.required, validators.minLength(2)],
    model: [validators.required, validators.minLength(2)],
    purchasePrice: [validators.numeric, validators.positive],
    cdwUrl: [validators.url],
  },

  user: {
    name: [validators.required, validators.minLength(2)],
    email: [validators.required, validators.email],
    department: [validators.required],
    role: [validators.required],
  },

  license: {
    name: [validators.required, validators.minLength(2)],
    vendor: [validators.required],
    totalSeats: [validators.required, validators.numeric, validators.positive],
    },
};

export default {
  validators,
  validateField,
  validateForm,
  schemas,
};

