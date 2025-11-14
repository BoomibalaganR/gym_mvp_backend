import { FirebaseStorageProvider } from './providers/firebase.storage.provider';
import { LocalStorageProvider } from './providers/local.storage.provider';
import { StorageProvider } from './providers/storage.provider.interface';
// services/storage/index.ts
import { StorageService } from './storage.service';

export const createStorageService = (): StorageService => {
  const Provider: new () => StorageProvider =
    process.env.NODE_ENV === 'production'
      ? FirebaseStorageProvider
      : LocalStorageProvider;

  return new StorageService(new Provider());
};
