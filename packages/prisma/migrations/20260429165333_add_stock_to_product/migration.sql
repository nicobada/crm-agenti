-- DropIndex
DROP INDEX "AuditLog_createdAt_idx";

-- DropIndex
DROP INDEX "AuditLog_resource_resourceId_idx";

-- DropIndex
DROP INDEX "AuditLog_userId_idx";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "stock" INTEGER DEFAULT 0;
