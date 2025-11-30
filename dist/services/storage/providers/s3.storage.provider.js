"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3StorageProvider = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const env_1 = require("../../../config/env");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
class S3StorageProvider {
    s3;
    bucketName;
    region;
    constructor() {
        this.region = env_1.config.aws_region;
        this.bucketName = env_1.config.bucket_name;
        this.s3 = new client_s3_1.S3Client({
            region: this.region,
            credentials: {
                accessKeyId: env_1.config.aws_access_key,
                secretAccessKey: env_1.config.aws_secret_key,
            },
        });
    }
    /** Upload a file buffer to S3 */
    async upload(file, destination) {
        const uploadCommand = new client_s3_1.PutObjectCommand({
            Bucket: this.bucketName,
            Key: destination,
            Body: file.buffer,
            ContentType: file.mimetype,
        });
        await this.s3.send(uploadCommand);
        return destination;
    }
    /** Generates a signed URL for reading */
    async getSignedUrl(filePath, expiresInMs = 15 * 60 * 1000, // 15 minutes
    extraParams = {}) {
        const command = new client_s3_1.GetObjectCommand({
            Bucket: this.bucketName,
            Key: filePath,
            ...extraParams,
        });
        const signedUrl = await (0, s3_request_presigner_1.getSignedUrl)(this.s3, command, {
            expiresIn: Math.floor(expiresInMs / 1000), // seconds
        });
        return signedUrl;
    }
    /** Delete file from S3 */
    async delete(filePath) {
        const deleteCommand = new client_s3_1.DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: filePath,
        });
        await this.s3.send(deleteCommand);
    }
    /** Public URL (only works if bucket/object is public) */
    getPublicUrl(filePath) {
        return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${filePath}`;
    }
}
exports.S3StorageProvider = S3StorageProvider;
