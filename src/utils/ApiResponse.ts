import { Response } from 'express';

export default class ApiResponse<T = any> {
  constructor(
    private success: boolean,
    private statusCode: number,
    private message: string,
    private data?: T,
    private meta?: any,
    private details?: any
  ) { }

  send(res: Response) {
      // Friendly JSON: only include fields that are not null
      const payload: any = {
        success: this.success,
        message: this.message,
      };

      if (this.data !== null) payload.data = this.data;
      if (this.meta !== null) payload.meta = this.meta;
      if (this.details !== null) payload.details = this.details;

      return res.status(this.statusCode).json(payload);
    }

  static success(res: Response, message: string, data?: any, meta?: any) {
    return new ApiResponse(true, 200, message, data, meta).send(res);
  }

  static created(res: Response, message: string, data?: any) {
    return new ApiResponse(true, 201, message, data).send(res);
  }

  static error(res: Response, statusCode: number, message: string, details?: any) {
    return new ApiResponse(false, statusCode, message, null, null, details).send(res);
  }
}
