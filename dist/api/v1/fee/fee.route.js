"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fee_validation_1 = require("./fee.validation");
const express_1 = require("express");
const auth_middleware_1 = __importDefault(require("../../../middlewares/auth.middleware"));
const role_middleware_1 = __importDefault(require("../../../middlewares/role.middleware"));
const validate_middleware_1 = __importDefault(require("../../../middlewares/validate.middleware"));
const fee_controller_1 = __importDefault(require("./fee.controller"));
const router = (0, express_1.Router)();
router.post('/:memberId/create', auth_middleware_1.default, (0, role_middleware_1.default)('owner', 'collector'), (0, validate_middleware_1.default)(fee_validation_1.createFeeSchema), fee_controller_1.default.create);
router.get('/', auth_middleware_1.default, (0, role_middleware_1.default)('owner', 'collector'), (0, validate_middleware_1.default)(fee_validation_1.feeDateRangeSchema), fee_controller_1.default.list);
router.patch('/verify', auth_middleware_1.default, (0, role_middleware_1.default)('owner', 'collector'), (0, validate_middleware_1.default)(fee_validation_1.verifyFeeSchema), fee_controller_1.default.updateVerified);
router.patch('/pending/pay', auth_middleware_1.default, (0, role_middleware_1.default)('owner', 'collector'), (0, validate_middleware_1.default)(fee_validation_1.markPendingFeeSchema), fee_controller_1.default.markPendingAsPaid);
router.get('/report', auth_middleware_1.default, (0, role_middleware_1.default)('owner', 'collector'), (0, validate_middleware_1.default)(fee_validation_1.lastNMonthsMemberSchema), fee_controller_1.default.getLastNMonthsMemberPaymentStatus);
exports.default = router;
