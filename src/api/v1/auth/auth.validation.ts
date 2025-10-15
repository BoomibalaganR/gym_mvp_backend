import Joi from 'joi';

export const loginSchema = {
  body: Joi.object({
    action: Joi.string().required().messages({
      'any.required': 'Please enter action.',
      'string.empty': 'Please enter action.'
    }),
    email: Joi.string().email().messages({
      'string.email': 'Please enter a valid email.'
    }),
    mobile: Joi.string().pattern(/^\d{10}$/).messages({
      'string.pattern.base': 'Please enter a valid mobile number.'
    }),
    logintype: Joi.string().required().messages({
      'any.required': 'Please enter login type.',
      'string.empty': 'Please enter login type.'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Please enter password.',
      'string.empty': 'Please enter password.'
    })
  })
};
