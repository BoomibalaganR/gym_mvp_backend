// services/storage/providers/storage.provider.interface.ts
export interface FileUpload {
  buffer: Buffer;
  mimetype: string;
}

export interface StorageProvider {
  upload(file: FileUpload, destination: string): Promise<string>;
  getSignedUrl(filePath: string, expiresInMs?: number, extraParams?: Record<string, any>): Promise<string>;
  delete(filePath: string): Promise<void>; 
  getPublicUrl(filePath: string): string;
}
