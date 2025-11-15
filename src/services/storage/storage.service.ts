// services/storage/storage.service.ts
import { FileUpload, StorageProvider } from './providers/storage.provider.interface';

export class StorageService {
  private provider: StorageProvider;

  constructor(provider: StorageProvider) {
    this.provider = provider;
  }

  async upload(
    file: FileUpload,
    filePath: string,
    extraParams?: Record<string, any>
  ): Promise<{ filePath: string; url: string }> {
    const uploadedPath = await this.provider.upload(file, filePath);
    const url = await this.provider.getSignedUrl(uploadedPath, undefined, extraParams);
    return { filePath: uploadedPath, url };
  }

  async getSignedUrl(filePath: string, expiresInMs?: number, extraParams?: Record<string, any>) {
    return this.provider.getSignedUrl(filePath, expiresInMs, extraParams);
  } 
getPublicUrl(filePath: string) {
    return this.provider.getPublicUrl(filePath);
  }

  async delete(filePath: string) {
    return this.provider.delete(filePath);
  }
}
