"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_controller_1 = __importDefault(require("./auth.controller"));
const express_1 = require("express");
const auth_validation_1 = require("./auth.validation");
const validate_middleware_1 = __importDefault(require("../../../middlewares/validate.middleware"));
const router = (0, express_1.Router)();
router.post('/login', (0, validate_middleware_1.default)(auth_validation_1.loginSchema), auth_controller_1.default.login);
exports.default = router;
