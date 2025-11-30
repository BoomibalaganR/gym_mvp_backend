"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = validate;
const ApiError_1 = __importDefault(require("../utils/ApiError"));
function validate(schema) {
    return (req, res, next) => {
        const bodyResult = schema.body ? schema.body.validate(req.body, { abortEarly: false }) : { error: null, value: req.body };
        const paramsResult = schema.params ? schema.params.validate(req.params, { abortEarly: false }) : { error: null, value: req.params };
        const queryResult = schema.query ? schema.query.validate(req.query, { abortEarly: false }) : { error: null, value: req.query };
        const formatDetails = (error) => error.details.map(detail => ({
            path: detail.path.join('.'),
            message: detail.message
        }));
        if (bodyResult.error) {
            return next(new ApiError_1.default(400, 'Validation Error', {
                source: 'body',
                details: formatDetails(bodyResult.error)
            }));
        }
        if (paramsResult.error) {
            return next(new ApiError_1.default(400, 'Validation Error', {
                source: 'params',
                details: formatDetails(paramsResult.error)
            }));
        }
        if (queryResult.error) {
            return next(new ApiError_1.default(400, 'Validation Error', {
                source: 'query',
                details: formatDetails(queryResult.error)
            }));
        }
        req.body = bodyResult.value;
        req.params = paramsResult.value;
        req.query = queryResult.value;
        next();
    };
}
