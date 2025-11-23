import { NextFunction, Request, Response } from 'express';
import Joi, { ObjectSchema } from 'joi';

import ApiError from '../utils/ApiError';

interface Schema {
  body?: ObjectSchema;
  params?: ObjectSchema;
  query?: ObjectSchema;
}

export default function validate(schema: Schema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const bodyResult = schema.body ? schema.body.validate(req.body, { abortEarly: false }) : { error: null, value: req.body };
    const paramsResult = schema.params ? schema.params.validate(req.params, { abortEarly: false }) : { error: null, value: req.params };
    const queryResult = schema.query ? schema.query.validate(req.query, { abortEarly: false }) : { error: null, value: req.query };

    const formatDetails = (error: Joi.ValidationError) =>
      error.details.map(detail => ({
        path: detail.path.join('.'),
        message: detail.message
      }));

    if (bodyResult.error) {
      return next(
        new ApiError(400, 'Validation Error', {
          source: 'body',
          details: formatDetails(bodyResult.error)
        })
      );
    }

    if (paramsResult.error) {
      return next(
        new ApiError(400, 'Validation Error', {
          source: 'params',
          details: formatDetails(paramsResult.error)
        })
      );
    }

    if (queryResult.error) {
      return next(
        new ApiError(400, 'Validation Error', {
          source: 'query',
          details: formatDetails(queryResult.error)
        })
      );
    }

    req.body = bodyResult.value;
    req.params = paramsResult.value;
    req.query = queryResult.value;

    next();
  };
}
