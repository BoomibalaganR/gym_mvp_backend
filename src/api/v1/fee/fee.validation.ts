import Joi from 'joi';

const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;


export const createFeeSchema = {
  body: Joi.object({
    months: Joi.array()
      .items(
        Joi.string()
          .pattern(monthRegex)
          .required()
          .messages({ "string.pattern.base": "Month must be in YYYY-MM format" })
      )
      .min(1)
      .required()
      .messages({
        "array.base": "Months must be an array",
        "array.min": "At least one month is required",
        "any.required": "Months are required"
      }),
    amount: Joi.number().positive().required().messages({
      "number.base": "Amount must be a number",
      "number.positive": "Amount must be greater than 0",
      "any.required": "Amount is required"
    }),
    paymentType: Joi.string().valid("cash", "gpay").required().messages({
      "any.only": "Payment type must be 'cash' or 'gpay'",
      "any.required": "Payment type is required"
    }),
    transactionId: Joi.string().optional()
  }).options({ stripUnknown: true, abortEarly: true })
};

export const verifyFeeSchema = {
  body: Joi.object({
    feeIds: Joi.array()
      .items(
        Joi.string()
          .trim()
          .length(24)
          .hex()
          .required()
          .messages({
            'string.base': 'Fee ID must be a string',
            'string.length': 'Fee ID must be 24 characters',
            'string.hex': 'Fee ID must be a valid ObjectId',
            'any.required': 'Fee ID is required'
          })
      )
      .min(1)
      .required()
      .messages({
        'array.base': 'feeIds must be an array',
        'array.min': 'At least one fee ID is required',
        'any.required': 'feeIds is required'
      })
  }).options({ stripUnknown: true, abortEarly: true })
};

export const markPendingFeeSchema = {
  body: Joi.object({
    feeId: Joi.string()
      .trim()
      .length(24)
      .hex()
      .messages({
        'string.base': 'feeId must be a string',
        'string.length': 'feeId must be 24 characters',
        'string.hex': 'feeId must be a valid ObjectId',
        'any.required': 'feeId is required'
      }),

    amount: Joi.number()
      .positive()
      .messages({
        'number.base': 'amount must be a number',
        'number.positive': 'amount must be greater than 0',
        'any.required': 'amount is required'
      })
  }).options({ stripUnknown: true, abortEarly: true })
};


export const feeDateRangeSchema = {
  query: Joi.object({
    start: Joi.string()
      .isoDate()
      .messages({
        'string.base': 'Start date must be a string',
        'string.empty': 'Start date is required',
        'string.isoDate': 'Start date must be a valid ISO date',
        'any.required': 'Start date is required'
      }),
    end: Joi.string()
      .isoDate()
      .messages({
        'string.base': 'End date must be a string',
        'string.empty': 'End date is required',
        'string.isoDate': 'End date must be a valid ISO date',
        'any.required': 'End date is required'
      }),
      month: Joi.string()
  .pattern(/^\d{4}-(0[1-9]|1[0-2])$/)
  .messages({
    "string.pattern.base": "month must be in YYYY-MM format like 2025-09"
  }),

    memberId: Joi.string()
      .trim()
      .length(24)
      .hex()
      .messages({
        'string.base': 'memberId must be a string',
        'string.length': 'memberId must be 24 characters',
        'string.hex': 'memberId must be a valid ObjectId'
      }),
    paymentType: Joi.string()
      .valid('cash', 'gpay')
      .optional()
      .messages({
        'any.only': 'Payment type must be either "cash" or "gpay"'
      }),
    paymentStatus: Joi.string()
      .valid('paid', 'pending')
      .optional()
      .messages({
        'any.only': 'Payment status must be either "paid" or "pending"'
      }),
    verifiedByOwner: Joi.boolean()
      .truthy('true')
      .falsy('false')
      .optional()
      .messages({
        'boolean.base': 'Verified by owner must be a boolean'
      })
  })
    .custom((value, helpers) => {
      const start = new Date(value.start);
      const end = new Date(value.end);
      if (start >= end) {
        return helpers.message('"start" must be less than "end"');
      }
      return value;
    })
    .options({ stripUnknown: true, abortEarly: true })
};

export const lastNMonthsMemberSchema = {
  query: Joi.object({
    month: Joi.string(),
    monthsCount: Joi.number().integer().min(0).optional(),
    status: Joi.string().valid('paid', 'unpaid', 'pending').optional(), 
    continuousUnpaid: Joi.boolean().optional()
  }).options({ stripUnknown: true, abortEarly: true })
};
