"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = errorHandler;
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const ApiResponse_1 = __importDefault(require("../utils/ApiResponse"));
const http_status_1 = __importDefault(require("http-status"));
function errorHandler(err, req, res, next) {
    if (err instanceof ApiError_1.default) {
        return ApiResponse_1.default.error(res, err.statusCode, err.message, err.details || null);
    }
    if (err instanceof SyntaxError && 'body' in err) {
        return ApiResponse_1.default.error(res, http_status_1.default.BAD_REQUEST, 'Invalid JSON format — please check your request body.');
    }
    console.error(err);
    return ApiResponse_1.default.error(res, 500, 'Internal Server Error');
}
