"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStorageService = void 0;
const local_storage_provider_1 = require("./providers/local.storage.provider");
const s3_storage_provider_1 = require("./providers/s3.storage.provider");
const storage_service_1 = require("./storage.service");
const env_1 = require("../../config/env");
const createStorageService = () => {
    const Provider = env_1.config.node_env === 'production'
        ? s3_storage_provider_1.S3StorageProvider
        : local_storage_provider_1.LocalStorageProvider;
    return new storage_service_1.StorageService(new Provider());
};
exports.createStorageService = createStorageService;
