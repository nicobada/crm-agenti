import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs';
import * as path from 'path';

export interface UploadMetadata {
  orderId?: string;
  clientId?: string;
  agentId?: string;
  documentType?: string;
  uploadedBy?: string;
}

@Injectable()
export class StorageService {
  private s3: S3Client | null = null;
  private bucket: string = 'crm-documents';
  private useLocalFallback: boolean = false;
  private localStoragePath: string = './uploads';

  constructor() {
    const endpoint = process.env.S3_ENDPOINT;
    const accessKey = process.env.S3_ACCESS_KEY;
    const secretKey = process.env.S3_SECRET_KEY;

    // Se non ci sono credenziali S3 valide, usa fallback locale
    if (!endpoint && (!accessKey || accessKey === 'minio')) {
      this.useLocalFallback = true;
      if (!fs.existsSync(this.localStoragePath)) {
        fs.mkdirSync(this.localStoragePath, { recursive: true });
      }
      console.log('[Storage] Modalita fallback locale attiva. File salvati in ./uploads/');
    } else {
      this.s3 = new S3Client({
        region: process.env.S3_REGION || 'eu-west-1',
        endpoint: endpoint || undefined,
        credentials: {
          accessKeyId: accessKey || 'minio',
          secretAccessKey: secretKey || 'minio123',
        },
        forcePathStyle: !!endpoint,
      });
      this.bucket = process.env.S3_BUCKET || 'crm-documents';
      console.log('[Storage] Modalita S3 attiva. Endpoint:', endpoint || 'AWS S3');
    }
  }

  private generateS3Key(
    file: Express.Multer.File,
    meta: UploadMetadata,
  ): { key: string; folder: string } {
    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;

    let folder = 'generici';
    let key = `generici/${fileName}`;

    if (meta.clientId) {
      folder = `clienti/${meta.clientId}`;
      key = `${folder}/documenti/${fileName}`;
    } else if (meta.orderId) {
      folder = `ordini/${meta.orderId}`;
      key = `${folder}/documenti/${fileName}`;
    } else if (meta.agentId) {
      folder = `agenti/${meta.agentId}`;
      key = `${folder}/documenti/${fileName}`;
    }

    return { key, folder };
  }

  async uploadBuffer(
    file: Express.Multer.File,
    meta: UploadMetadata,
  ): Promise<{ url: string; key: string; folder: string }> {
    const { key, folder } = this.generateS3Key(file, meta);

    if (this.useLocalFallback) {
      // Fallback locale: salva su filesystem
      const localPath = path.join(this.localStoragePath, key);
      const dir = path.dirname(localPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(localPath, file.buffer);

      const url = `http://localhost:${process.env.PORT || 3001}/uploads/${key}`;
      console.log('[Storage] File salvato localmente:', localPath);
      return { url, key, folder };
    }

    if (!this.s3) {
      throw new Error('S3 client non inizializzato');
    }

    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          Metadata: {
            'uploaded-by': meta.uploadedBy || 'system',
            'document-type': meta.documentType || 'other',
            'original-name': file.originalname,
            'client-id': meta.clientId || '',
            'order-id': meta.orderId || '',
          },
        }),
      );

      const publicUrl = process.env.S3_PUBLIC_URL || `https://${this.bucket}.s3.amazonaws.com`;
      const url = `${publicUrl}/${key}`;

      return { url, key, folder };
    } catch (error) {
      console.warn('[Storage] Caricamento S3 fallito, fallback su filesystem locale:', error.message);
      
      // Fallback locale di emergenza
      const localPath = path.join(this.localStoragePath, key);
      const dir = path.dirname(localPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(localPath, file.buffer);

      const url = `http://localhost:${process.env.PORT || 3001}/uploads/${key}`;
      return { url, key, folder };
    }
  }

  async delete(key: string): Promise<void> {
    if (this.useLocalFallback) {
      const localPath = path.join(this.localStoragePath, key);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
      return;
    }

    if (!this.s3) return;
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  async getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    if (this.useLocalFallback) {
      return `http://localhost:${process.env.PORT || 3001}/uploads/${key}`;
    }
    if (!this.s3) throw new Error('S3 client non inizializzato');
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.s3, command, { expiresIn });
  }

  async getSignedUploadUrl(key: string, contentType: string, expiresIn = 300): Promise<string> {
    if (this.useLocalFallback) {
      return `http://localhost:${process.env.PORT || 3001}/uploads/${key}`;
    }
    if (!this.s3) throw new Error('S3 client non inizializzato');
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.s3, command, { expiresIn });
  }
}
