import Joi from 'joi';

export const createGymSchema = {
  body: Joi.object({
    name: Joi.string().required().messages({
      'string.empty': 'Gym name is required',
      'any.required': 'Gym name is required'
    }),
    location: Joi.string().required().messages({
      'string.empty': 'Location is required',
      'any.required': 'Location is required'
    }),
    phone: Joi.string().pattern(/^\d{10}$/).messages({
      'string.empty': 'Gym phone number is required',
      'string.pattern.base': 'Phone must be 10 digits',
      'any.required': 'Gym phone number is required'
    }),
    contact_person: Joi.string().required().messages({
      'string.empty': 'Contact person is required',
      'any.required': 'Contact person is required'
    }),
    owner_name: Joi.string().required().messages({
      'string.empty': 'Owner name is required',
      'any.required': 'Owner name is required'
    }),
    owner_phone: Joi.string().pattern(/^\d{10}$/).required().messages({
      'string.empty': 'Owner phone is required',
      'string.pattern.base': 'Owner phone must be 10 digits',
      'any.required': 'Owner phone is required'
    }),
    owner_email: Joi.string().email().required().messages({
      'string.empty': 'Owner email is required',
      'string.email': 'Owner email must be valid',
      'any.required': 'Owner email is required'
    }),
    owner_password: Joi.string().min(6).messages({
      'string.empty': 'Owner password is required',
      'string.min': 'Owner password must be at least 6 characters',
      'any.required': 'Owner password is required'
    })
  }).options({ abortEarly: false })
};
