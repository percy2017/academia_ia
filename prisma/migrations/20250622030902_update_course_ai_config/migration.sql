/*
  Warnings:

  - You are about to drop the column `n8nWebhookUrl` on the `Course` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Course" DROP COLUMN "n8nWebhookUrl",
ADD COLUMN     "aiApiKey" TEXT,
ADD COLUMN     "aiModelName" TEXT,
ADD COLUMN     "aiProvider" TEXT,
ADD COLUMN     "aiTemperature" DOUBLE PRECISION;
