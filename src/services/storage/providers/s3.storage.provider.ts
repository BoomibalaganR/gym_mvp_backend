import {
    DeleteObjectCommand,
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3";
import { FileUpload, StorageProvider } from "./storage.provider.interface";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "../../../config/env";

export class S3StorageProvider implements StorageProvider {
  private s3: S3Client;
  private bucketName: string;
  private region: string;

  constructor() {
    this.region = config.aws_region!;
    this.bucketName = config.bucket_name!;

    this.s3 = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: config.aws_access_key!,
        secretAccessKey: config.aws_secret_key!,
      },
    });
  }

  /** Upload a file buffer to S3 */
  async upload(file: FileUpload, destination: string): Promise<string> {
    const uploadCommand = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: destination,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3.send(uploadCommand);
    return destination;
  }

  /** Generates a signed URL for reading */
  async getSignedUrl(
    filePath: string,
    expiresInMs = 15 * 60 * 1000, // 15 minutes
    extraParams: Record<string, any> = {}
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: filePath,
      ...extraParams,
    });

    const signedUrl = await getSignedUrl(this.s3, command, {
      expiresIn: Math.floor(expiresInMs / 1000), // seconds
    });

    return signedUrl;
  }

  /** Delete file from S3 */
  async delete(filePath: string): Promise<void> {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: filePath,
    });

    await this.s3.send(deleteCommand);
  }

  /** Public URL (only works if bucket/object is public) */
  getPublicUrl(filePath: string): string {
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${filePath}`;
  }
}
