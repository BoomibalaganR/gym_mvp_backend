"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const member_validation_1 = require("./member.validation");
const express_1 = require("express");
const auth_middleware_1 = __importDefault(require("../../../middlewares/auth.middleware"));
const role_middleware_1 = __importDefault(require("../../../middlewares/role.middleware"));
const validate_middleware_1 = __importDefault(require("./../../../middlewares/validate.middleware"));
const member_controller_1 = __importDefault(require("./member.controller"));
const router = (0, express_1.Router)();
router.post('/', auth_middleware_1.default, (0, role_middleware_1.default)('owner', 'collector'), (0, validate_middleware_1.default)(member_validation_1.createMemberSchema), member_controller_1.default.create);
router.get('/', auth_middleware_1.default, (0, role_middleware_1.default)('owner', 'collector'), member_controller_1.default.list);
router.get('/:id', auth_middleware_1.default, (0, role_middleware_1.default)('owner'), member_controller_1.default.get);
router.put('/:id', auth_middleware_1.default, (0, role_middleware_1.default)('owner'), (0, validate_middleware_1.default)(member_validation_1.updateMemberSchema), member_controller_1.default.update);
// routes/memberRoutes.js
router.post('/batch', auth_middleware_1.default, 
//   upload.single('csvFile'), // Expecting a CSV file
//   validate(batchMemberValidation),
member_controller_1.default.batchCreate);
router.delete('/:id', auth_middleware_1.default, (0, role_middleware_1.default)('owner'), member_controller_1.default.deactivate);
router.patch('/bot-access', auth_middleware_1.default, (0, role_middleware_1.default)('owner'), member_controller_1.default.setBotAccess);
router.get('/:id/profile-pic', auth_middleware_1.default, (0, role_middleware_1.default)('owner'), member_controller_1.default.getProfilePic);
router.post('/:id/profile-pic', auth_middleware_1.default, (0, role_middleware_1.default)('owner'), member_controller_1.default.uploadProfilePic);
router.delete('/:id/profile-pic', auth_middleware_1.default, (0, role_middleware_1.default)('owner'), member_controller_1.default.deleteProfilePic);
exports.default = router;
