"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
class ApiResponse {
    success;
    statusCode;
    message;
    data;
    meta;
    details;
    constructor(success, statusCode, message, data, meta, details) {
        this.success = success;
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.meta = meta;
        this.details = details;
    }
    send(res) {
        const payload = {
            success: this.success,
            message: this.message,
        };
        // Only attach fields when defined
        if (this.data !== undefined)
            payload.data = this.data;
        if (this.meta !== undefined)
            payload.meta = this.meta;
        if (this.details !== undefined)
            payload.details = this.details;
        console.log(payload);
        return res.status(this.statusCode).json(payload);
    }
    static success(res, message, data, meta) {
        return new ApiResponse(true, http_status_1.default.OK, message, data, meta).send(res);
    }
    static created(res, message, data) {
        return new ApiResponse(true, http_status_1.default.CREATED, message, data).send(res);
    }
    static error(res, statusCode, message, details) {
        return new ApiResponse(false, statusCode, message, null, null, details).send(res);
    }
}
exports.default = ApiResponse;
