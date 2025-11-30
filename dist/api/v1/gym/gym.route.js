"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const gym_controller_1 = __importDefault(require("./gym.controller"));
const express_1 = require("express");
const gym_validation_1 = require("./gym.validation");
const validate_middleware_1 = __importDefault(require("../../../middlewares/validate.middleware"));
const router = (0, express_1.Router)();
router.post('/onboard', (0, validate_middleware_1.default)(gym_validation_1.createGymSchema), gym_controller_1.default.onboard);
router.get('/:id', gym_controller_1.default.get);
router.get('/', gym_controller_1.default.list);
exports.default = router;
