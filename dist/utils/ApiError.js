"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ApiError extends Error {
    statusCode;
    details;
    constructor(statusCode, message, details) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
    }
}
exports.default = ApiError;
