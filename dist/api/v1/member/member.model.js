"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const mongoose_1 = __importDefault(require("mongoose"));
const storage_1 = require("../../../services/storage");
const image_util_1 = require("../../../utils/image.util");
const MemberSchema = new mongoose_1.default.Schema({
    gym: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Gym', required: true },
    first_name: { type: String, required: true },
    last_name: { type: String, required: false },
    phone: { type: String, required: true, unique: true, sparse: true },
    email: { type: String, sparse: true },
    nickname: { type: String },
    gender: { type: String, enum: ['male', 'female', 'other'], default: 'other' },
    profilepic_content_type: { type: String },
    profilepic_hash: { type: String, default: null },
    referred_by: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Member',
        default: null,
    },
    otp: { type: String, select: false },
    otp_expiry: { type: Date },
    address: { type: String },
    working_status: { type: String },
    session: { type: String },
    branch: { type: String },
    role: { type: String, enum: ['owner', 'collector', 'member'], default: 'member' },
    is_admin: { type: Boolean, default: false },
    can_access_bot: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true },
    password: { type: String, select: false } // hashed password for owners/collectors
}, { timestamps: true });
// Unique per gym on phone
MemberSchema.index({ gym_id: 1, phone: 1 });
MemberSchema.methods.getFullName = function () {
    return [this.first_name, this.last_name].filter(Boolean).join(' ');
};
MemberSchema.methods.isPasswordMatch = async function (password) {
    return await bcryptjs_1.default.compare(password, this.password);
};
MemberSchema.methods.getProfilePicStorageKey = function () {
    return `member-${this._id}/profilepic.webp`;
};
MemberSchema.methods.uploadProfilePic = async function (file) {
    const storage = (0, storage_1.createStorageService)();
    const filePath = this.getProfilePicStorageKey();
    const beforeSizeKB = (file.buffer.length / 1024).toFixed(2);
    console.log("📸 Before compression:", beforeSizeKB, "KB");
    // 1. Optimize + convert to WEBP (sharp util)
    const optimizedBuffer = await (0, image_util_1.optimizeImage)(file.buffer, {
        width: 600,
        height: 600,
        quality: 85,
    });
    const optimizedFile = {
        buffer: optimizedBuffer,
        mimetype: "image/webp", // Always store as webp
        filename: file.filename,
        size: optimizedBuffer.length,
    };
    const afterSizeKB = (optimizedBuffer.length / 1024).toFixed(2);
    console.log("🎯 After compression:", afterSizeKB, "KB");
    // 2. Upload optimized file to S3
    await storage.upload(optimizedFile, filePath, {
        ResponseContentType: "image/webp",
    });
    // 3. Update metadata in DB
    this.profilepic_content_type = "image/webp";
    // Hash changes → client refreshes cached profile pic
    this.profilepic_hash = crypto_1.default.randomUUID();
    await this.save();
    return {
        hash: this.profilepic_hash,
    };
};
MemberSchema.methods.deleteProfilePic = async function () {
    const storage = (0, storage_1.createStorageService)();
    const filePath = this.getProfilePicStorageKey();
    if (filePath) {
        await storage.delete(filePath);
    }
    this.profilepic_hash = null;
    this.profilepic_content_type = null;
    await this.save();
};
MemberSchema.methods.getProfilePicSignedUrl = async function () {
    if (!this.profilepic_content_type || !this.profilepic_hash)
        return '';
    const storage = (0, storage_1.createStorageService)();
    const extraParams = this.profilepic_content_type
        ? { ResponseContentType: this.profilepic_content_type }
        : {};
    return await storage.getSignedUrl(this.getProfilePicStorageKey(), undefined, extraParams);
};
MemberSchema.methods.getprofilePicPublicUrl = function () {
    if (!this.profilepic_content_type || !this.profilepic_hash)
        return '';
    const storage = (0, storage_1.createStorageService)();
    return storage.getPublicUrl(this.getProfilePicStorageKey()) + `?v=${this.profilepic_hash}`;
};
MemberSchema.methods.getProfilePicProxyUrl = function () {
    if (!this.profilepic_content_type || !this.profilepic_hash)
        return '';
    return `/api/v1/members/${this._id}/profile-pic/?h=${this.profilepic_hash}`;
};
MemberSchema.pre("save", async function (next) {
    if (!this.isModified("password") || !this.password)
        return next();
    try {
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(String(this.password), salt);
        this.password = hashedPassword;
        next();
    }
    catch (error) {
        next(error);
    }
});
exports.default = mongoose_1.default.model('Member', MemberSchema);
