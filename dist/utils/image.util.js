"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optimizeImage = optimizeImage;
const sharp_1 = __importDefault(require("sharp"));
/**
 * Optimize an image buffer using Sharp:
 * - Resize (default: 600x600)
 * - Convert to WEBP
 * - Compress with quality (default: 85)
 */
async function optimizeImage(buffer, options = {}) {
    const { width = 600, height = 600, quality = 85, } = options;
    return await (0, sharp_1.default)(buffer)
        .resize(width, height, { fit: "cover" }) // Crop + center fit
        .webp({ quality })
        .toBuffer();
}
