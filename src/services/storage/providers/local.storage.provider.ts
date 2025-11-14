import { FileUpload, StorageProvider } from './storage.provider.interface';

// services/storage/providers/local.storage.provider.ts
import fs from 'fs';
import path from 'path';

export class LocalStorageProvider implements StorageProvider {
  private baseDir = path.resolve('uploads');

  async upload(file: FileUpload, destination: string): Promise<string> {
    const destPath = path.join(this.baseDir, destination);
    await fs.promises.mkdir(path.dirname(destPath), { recursive: true });
    await fs.promises.writeFile(destPath, file.buffer);
    return destPath;
  }

  async getSignedUrl(filePath: string): Promise<string> {
    // For dev — just return a relative path
    return `/uploads/${path.basename(filePath)}`;
  }

  async delete(filePath: string): Promise<void> {
    await fs.promises.unlink(path.join(this.baseDir, filePath)).catch(() => {});
  }
}
