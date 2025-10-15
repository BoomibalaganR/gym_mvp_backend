import { NextFunction, Request, Response } from 'express';

import ApiError from '../utils/ApiError';

export default function authorize(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) return next(new ApiError(401, 'Unauthorized'));
    if (allowedRoles.length && !allowedRoles.includes(user.role)) {
      return next(new ApiError(403, 'Forbidden: insufficient role'));
    }
    next();
  };
}
