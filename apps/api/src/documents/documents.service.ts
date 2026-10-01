import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService, UploadMetadata } from '../storage/storage.service';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async findAll(filters: { orderId?: string; clientId?: string; type?: string; agentId?: string }) {
    const where: any = {};
    if (filters.orderId) where.orderId = filters.orderId;
    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.type) where.type = filters.type;

    // Filtro ownership per agente (se non fornito, l'admin vede tutto)
    if (filters.agentId) {
      where.OR = [
        { order: { agentId: filters.agentId } },
        { client: { agentId: filters.agentId } },
      ];
    }

    return this.prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        order: { select: { orderNumber: true } },
        client: { select: { name: true } },
      },
    });
  }

  async findOne(id: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: {
        order: { select: { orderNumber: true } },
        client: { select: { name: true } },
      },
    });
    if (!doc) throw new NotFoundException('Documento non trovato');
    return doc;
  }

  async upload(
    file: Express.Multer.File,
    meta: {
      orderId?: string;
      clientId?: string;
      type?: string;
      uploadedBy?: string;
    },
  ) {
    // Recupera agentId dal client o order per path strutturato
    let agentId: string | undefined;
    if (meta.clientId) {
      const client = await this.prisma.client.findUnique({
        where: { id: meta.clientId },
        select: { agentId: true },
      });
      agentId = client?.agentId;
    } else if (meta.orderId) {
      const order = await this.prisma.order.findUnique({
        where: { id: meta.orderId },
        select: { agentId: true },
      });
      agentId = order?.agentId;
    }

    const uploadMeta: UploadMetadata = {
      orderId: meta.orderId,
      clientId: meta.clientId,
      agentId,
      documentType: meta.type,
      uploadedBy: meta.uploadedBy,
    };

    const { url, key, folder } = await this.storage.uploadBuffer(file, uploadMeta);

    return this.prisma.document.create({
      data: {
        orderId: meta.orderId || null,
        clientId: meta.clientId || null,
        type: (meta.type as any) || 'OTHER',
        fileName: file.originalname,
        fileUrl: url,
        mimeType: file.mimetype,
        size: file.size,
        s3Key: key,
      },
      include: {
        order: { select: { orderNumber: true } },
        client: { select: { name: true } },
      },
    });
  }

  async remove(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Documento non trovato');

    if (doc.s3Key) {
      await this.storage.delete(doc.s3Key);
    }

    return this.prisma.document.delete({ where: { id } });
  }

  async getDownloadUrl(id: string) {
    const doc = await this.findOne(id);
    if (!doc.s3Key) return { url: doc.fileUrl, isSigned: false };

    const signedUrl = await this.storage.getSignedDownloadUrl(doc.s3Key, 3600);
    return { url: signedUrl, isSigned: true, expiresIn: 3600 };
  }
}
