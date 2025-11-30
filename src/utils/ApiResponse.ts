import { Response } from 'express';
import httpStatus from 'http-status';

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
    const payload: any = {
      success: this.success,
      message: this.message,
    };

    // Only attach fields when defined
    if (this.data !== undefined) payload.data = this.data;
    if (this.meta !== undefined) payload.meta = this.meta;
    if (this.details !== undefined) payload.details = this.details;
    console.log(payload)
    return res.status(this.statusCode).json(payload);
  }

  static success(res: Response, message: string, data?: any, meta?: any) {
    return new ApiResponse(true, httpStatus.OK, message, data, meta).send(res);
  }

  static created(res: Response, message: string, data?: any) {
    return new ApiResponse(true, httpStatus.CREATED, message, data).send(res);
  }  


  static error(res: Response, statusCode: number, message: string, details?: any) {
    return new ApiResponse(false, statusCode, message, null, null, details).send(res);
  }
}
