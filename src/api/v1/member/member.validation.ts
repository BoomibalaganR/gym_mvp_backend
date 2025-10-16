import Joi from 'joi';

export const createMemberSchema = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(50).required().messages({
      'string.empty': 'Member name is required',
      'string.min': 'Member name must be at least 2 characters',
      'string.max': 'Member name must be at most 50 characters',
      'any.required': 'Member name is required'
    }),
    phone: Joi.string().pattern(/^\d{10}$/).required().messages({
      'string.empty': 'Member phone number is required',
      'string.pattern.base': 'Phone must be 10 digits',
      'any.required': 'Member phone number is required'
    }),
    nick_name: Joi.string().trim().max(30).optional().allow(null, '').messages({
      'string.max': 'Nick name must be at most 30 characters'
    }),
    profile_pic: Joi.string().uri().optional().allow(null, '').messages({
      'string.uri': 'Profile picture must be a valid URL'
    }),
    referred_by: Joi.string().trim().max(50).optional().allow(null, '').messages({
      'string.max': 'Referred by must be at most 50 characters'
    }),
    address: Joi.string().trim().max(200).optional().allow(null, '').messages({
      'string.max': 'Address must be at most 200 characters'
    }),
    working_status: Joi.string().valid('active', 'inactive').optional().messages({
      'any.only': 'Working status must be either active or inactive'
    }),
    session: Joi.string().valid('morning', 'evening').optional().messages({
      'any.only': 'Session must be either morning or evening'
    }),
    branch: Joi.string().trim().max(50).optional().allow(null, '').messages({
      'string.max': 'Branch must be at most 50 characters'
    })
  }).options({ abortEarly: false })
};
