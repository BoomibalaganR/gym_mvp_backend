"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberController = void 0;
const ApiResponse_1 = __importDefault(require("../../../utils/ApiResponse"));
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const member_csv_service_1 = __importDefault(require("./member.csv.service"));
const member_service_1 = __importDefault(require("./member.service"));
class MemberController {
    // controllers/memberController.js
    batchCreate = (0, catchAsync_1.default)(async (req, res) => {
        const result = await member_csv_service_1.default.batchCreate(req.gym, req.user, req.file, req.body);
        return ApiResponse_1.default.created(res, 'Members batch created successfully', result);
    });
    create = (0, catchAsync_1.default)(async (req, res) => {
        const member = await member_service_1.default.create(req.gym, req.user, req.file, req.body);
        return ApiResponse_1.default.created(res, 'Member created', member);
    });
    list = (0, catchAsync_1.default)(async (req, res) => {
        const result = await member_service_1.default.list(req.gym, req.user, req.query);
        return ApiResponse_1.default.success(res, 'Members fetched', result);
    });
    get = (0, catchAsync_1.default)(async (req, res) => {
        const result = await member_service_1.default.get(req.gym, req.user, req.params.id, req.query);
        return ApiResponse_1.default.success(res, 'Member fetched', result);
    });
    update = (0, catchAsync_1.default)(async (req, res) => {
        const updated = await member_service_1.default.update(req.gym, req.user, req.params.id, req.body);
        return ApiResponse_1.default.success(res, 'Member updated', updated);
    });
    getProfilePic = (0, catchAsync_1.default)(async (req, res) => {
        const signedUrl = await member_service_1.default.getProfilePicUrl(req.gym, req.user, req.params.id);
        return ApiResponse_1.default.success(res, 'Profile picture URL fetched', { url: signedUrl });
    });
    uploadProfilePic = (0, catchAsync_1.default)(async (req, res) => {
        const updated = await member_service_1.default.uploadProfilePic(req.gym, req.user, req.params.id, req.file);
        return ApiResponse_1.default.success(res, 'Profile picture uploaded', updated);
    });
    deleteProfilePic = (0, catchAsync_1.default)(async (req, res) => {
        const updated = await member_service_1.default.deleteProfilePic(req.gym, req.user, req.params.id);
        return ApiResponse_1.default.success(res, 'Profile picture deleted', updated);
    });
    deactivate = (0, catchAsync_1.default)(async (req, res) => {
        await member_service_1.default.deactivate(req.gym, req.user, req.params.id);
        return ApiResponse_1.default.success(res, 'Member deleted');
    });
    setBotAccess = (0, catchAsync_1.default)(async (req, res) => {
        const user = req.user;
        const { memberId, canAccess } = req.body;
        const updated = await member_service_1.default.setBotAccess(user.gym_id, memberId, !!canAccess);
        return ApiResponse_1.default.success(res, 'Collector access updated', updated);
    });
}
exports.MemberController = MemberController;
exports.default = new MemberController();
