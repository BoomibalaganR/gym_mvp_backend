import { config } from '../../config/env';
import { LocalStorageProvider } from './providers/local.storage.provider';
import { S3StorageProvider } from './providers/s3.storage.provider';
import { StorageProvider } from './providers/storage.provider.interface';
import { StorageService } from './storage.service';

export const createStorageService = (): StorageService => {
  const Provider: new () => StorageProvider =
    config.node_env === 'production'
      ? S3StorageProvider
      : LocalStorageProvider;

  return new StorageService(new Provider());
};
