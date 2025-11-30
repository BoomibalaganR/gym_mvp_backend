import { NextFunction, Request, Response } from 'express';

import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';

export default function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ApiError) {
    return ApiResponse.error(res, err.statusCode, err.message, err.details || null)
  }
  if (err instanceof SyntaxError && 'body' in err) {
    return ApiResponse.error(
      res,
      httpStatus.BAD_REQUEST,
      'Invalid JSON format — please check your request body.'
      
    );
  }

  console.error(err);
  return ApiResponse.error(res, 500, 'Internal Server Error')
  
}
