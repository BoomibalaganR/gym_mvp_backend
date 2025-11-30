"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalStorageProvider = void 0;
// services/storage/providers/local.storage.provider.ts
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class LocalStorageProvider {
    baseDir = path_1.default.resolve('uploads');
    async upload(file, destination) {
        const destPath = path_1.default.join(this.baseDir, destination);
        await fs_1.default.promises.mkdir(path_1.default.dirname(destPath), { recursive: true });
        await fs_1.default.promises.writeFile(destPath, file.buffer);
        return destPath;
    }
    async getSignedUrl(filePath) {
        // For dev — just return a relative path
        return `/uploads/${path_1.default.basename(filePath)}`;
    }
    async delete(filePath) {
        await fs_1.default.promises.unlink(path_1.default.join(this.baseDir, filePath)).catch(() => { });
    }
    getPublicUrl(filePath) {
        return `/uploads/${path_1.default.basename(filePath)}`;
    }
}
exports.LocalStorageProvider = LocalStorageProvider;
