import Joi from 'joi';

export const loginSchema = {
  body: Joi.object({
    logintype: Joi.string().valid('email', 'phone').required().messages({
      'any.required': 'Please specify login type.',
      'any.only': 'Login type must be either email or phone.'
    }),

    // email login fields
    email: Joi.string().email().when('logintype', {
      is: 'email',
      then: Joi.required().messages({
        'any.required': 'Email is required for email login.',
        'string.email': 'Please enter a valid email address.'
      }),
      otherwise: Joi.forbidden()
    }),

    password: Joi.string().when('logintype', {
      is: 'email',
      then: Joi.required().messages({
        'any.required': 'Password is required for email login.'
      }),
      otherwise: Joi.forbidden()
    }),

    // phone login fields
    phone: Joi.string()
      .pattern(/^\d{10}$/)
      .when('logintype', {
        is: 'phone',
        then: Joi.required().messages({
          'any.required': 'phone number is required for phone login.',
          'string.pattern.base': 'Please enter a valid 10-digit phone number.'
        }),
        otherwise: Joi.forbidden()
      }),

    action: Joi.string()
      .valid('send_otp', 'verify_otp')
      .when('logintype', {
        is: 'phone',
        then: Joi.required().messages({
          'any.required': 'Action is required for phone login (send_otp or verify_otp).'
        }),
        otherwise: Joi.forbidden()
      }),

    otp: Joi.string()
      .length(6)
      .pattern(/^\d{6}$/)
      .when('action', {
        is: 'verify_otp',
        then: Joi.required().messages({
          'any.required': 'OTP is required for verification.',
          'string.pattern.base': 'OTP must be 6 digits.'
        }),
        otherwise: Joi.forbidden()
      })
  })
};
