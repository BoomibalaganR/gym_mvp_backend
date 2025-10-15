import { Storage as FirebaseStorage } from '@google-cloud/storage';
import path from 'path';

export interface FileUpload {
  buffer: Buffer;
  mimetype: string;
}

export interface StorageClient {
  upload(file: FileUpload, destination: string): Promise<string>;
  getSignedUrl(filePath: string, expiresInMs?: number, extraParams?: Record<string, any>): Promise<string>;
  delete(filePath: string): Promise<void>;
}

// ---------------- Firebase Implementation ----------------
class FirebaseStorageClient implements StorageClient {
  private storage: FirebaseStorage;
  private bucketName: string;

  constructor(bucketName: string, projectId: string, keyFilePath: string) {
    this.storage = new FirebaseStorage({ projectId, keyFilename: keyFilePath });
    this.bucketName = bucketName;
  }

  async upload(file: FileUpload, destination: string): Promise<string> {
    const bucket = this.storage.bucket(this.bucketName);
    const fileObject = bucket.file(destination);

    await fileObject.save(file.buffer, {
      contentType: file.mimetype,
    });

    return destination; // store path in DB
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

// ---------------- Storage Service ----------------
export class StorageService {
  private client: StorageClient;

  constructor(client: StorageClient) {
    this.client = client;
  }

  async upload(file: FileUpload, filePath: string, extraParams?: Record<string, any>): Promise<{ filePath: string; url: string }> {
    const path = await this.client.upload(file, filePath);
    const url = await this.client.getSignedUrl(path, undefined, extraParams);
    return { filePath: path, url };
  }

  async getSignedUrl(filePath: string, expiresInMs?: number, extraParams?: Record<string, any>) {
    return this.client.getSignedUrl(filePath, expiresInMs, extraParams);
  }

  async delete(filePath: string) {
    return this.client.delete(filePath);
  }
}


export const createStorage = (): StorageService => {
  const PROJECT_ID = process.env.FIREBASE_PROJECT_ID!;
  const BUCKET_NAME = process.env.FIREBASE_BUCKET_NAME!;
  const KEY_FILE = path.resolve(process.cwd(), process.env.FIREBASE_KEY_FILE!);

  const firebaseClient = new FirebaseStorageClient(BUCKET_NAME, PROJECT_ID, KEY_FILE);
  return new StorageService(firebaseClient);
};
