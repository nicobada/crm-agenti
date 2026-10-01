-- DropForeignKey
ALTER TABLE "Client" DROP CONSTRAINT "Client_agentId_fkey";

-- AlterTable
ALTER TABLE "Client" ALTER COLUMN "agentId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
