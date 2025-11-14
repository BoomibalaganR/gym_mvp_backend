import { FileUpload, StorageProvider } from './storage.provider.interface';

// services/storage/providers/firebase.storage.provider.ts
import { Storage as FirebaseStorage } from '@google-cloud/storage';
import { config } from '../../../config/env';

export class FirebaseStorageProvider implements StorageProvider {
  private storage: FirebaseStorage;
  private bucketName: string;

  constructor() {
    this.storage = new FirebaseStorage({
      projectId: config.project_id!,
      keyFilename: config.key_file!,
    });
    this.bucketName = config.bucket_name!;
  }

  async upload(file: FileUpload, destination: string): Promise<string> {
    const bucket = this.storage.bucket(this.bucketName);
    const fileObject = bucket.file(destination);
    await fileObject.save(file.buffer, { contentType: file.mimetype });
    return destination;
  }

  async getSignedUrl(
    filePath: string,
    expiresInMs = 15 * 60 * 1000,
    extraParams: Record<string, any> = {}
  ): Promise<string> {
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

  async delete(filePath: string): Promise<void> {
    const bucket = this.storage.bucket(this.bucketName);
    await bucket.file(filePath).delete();
  }
}
