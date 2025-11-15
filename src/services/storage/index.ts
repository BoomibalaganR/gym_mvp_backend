import { FirebaseStorageProvider } from './providers/firebase.storage.provider';
import { LocalStorageProvider } from './providers/local.storage.provider';
import { StorageProvider } from './providers/storage.provider.interface';
// services/storage/index.ts
import { StorageService } from './storage.service';
import { config } from '../../config/env';

export const createStorageService = (): StorageService => {
  const Provider: new () => StorageProvider =
    config.node_env === 'production'
      ? FirebaseStorageProvider
      : LocalStorageProvider;

  return new StorageService(new Provider());
};
