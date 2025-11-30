"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseStorageProvider = void 0;
// services/storage/providers/firebase.storage.provider.ts
const storage_1 = require("@google-cloud/storage");
const env_1 = require("../../../config/env");
class FirebaseStorageProvider {
    storage;
    bucketName;
    constructor() {
        this.storage = new storage_1.Storage({
            projectId: env_1.config.project_id,
            keyFilename: env_1.config.key_file,
        });
        this.bucketName = env_1.config.bucket_name;
    }
    async upload(file, destination) {
        const bucket = this.storage.bucket(this.bucketName);
        const fileObject = bucket.file(destination);
        await fileObject.save(file.buffer, { contentType: file.mimetype });
        return destination;
    }
    async getSignedUrl(filePath, expiresInMs = 15 * 60 * 1000, extraParams = {}) {
        const bucket = this.storage.bucket(this.bucketName);
        const fileObject = bucket.file(filePath);
        const expirationTime = Date.now() + expiresInMs;
        const [signedUrl] = await fileObject.getSignedUrl({
            action: 'read',
            expires: expirationTime,
            queryParams: extraParams,
        });
        return signedUrl;
    }
    async delete(filePath) {
        const bucket = this.storage.bucket(this.bucketName);
        await bucket.file(filePath).delete();
    }
    getPublicUrl(filePath) {
        return `https://storage.googleapis.com/${this.bucketName}/${filePath}`;
    }
}
exports.FirebaseStorageProvider = FirebaseStorageProvider;
