"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dashboard_controller_1 = __importDefault(require("./dashboard.controller"));
const express_1 = require("express");
const auth_middleware_1 = __importDefault(require("../../../middlewares/auth.middleware"));
const role_middleware_1 = __importDefault(require("../../../middlewares/role.middleware"));
const router = (0, express_1.Router)();
router.get('/summary', auth_middleware_1.default, (0, role_middleware_1.default)('owner', 'collector'), dashboard_controller_1.default.getDashboardSummary);
exports.default = router;
