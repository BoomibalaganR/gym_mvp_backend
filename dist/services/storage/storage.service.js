"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
class StorageService {
    provider;
    constructor(provider) {
        this.provider = provider;
    }
    async upload(file, filePath, extraParams) {
        const uploadedPath = await this.provider.upload(file, filePath);
        const url = await this.provider.getSignedUrl(uploadedPath, undefined, extraParams);
        return { filePath: uploadedPath, url };
    }
    async getSignedUrl(filePath, expiresInMs, extraParams) {
        return this.provider.getSignedUrl(filePath, expiresInMs, extraParams);
    }
    getPublicUrl(filePath) {
        return this.provider.getPublicUrl(filePath);
    }
    async delete(filePath) {
        return this.provider.delete(filePath);
    }
}
exports.StorageService = StorageService;
