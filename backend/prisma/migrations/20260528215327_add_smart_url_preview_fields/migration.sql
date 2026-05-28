-- CreateEnum
CREATE TYPE "ImageSource" AS ENUM ('MANUAL_UPLOAD', 'OG_FETCH');

-- CreateEnum
CREATE TYPE "ContentSource" AS ENUM ('MANUAL_UPLOAD', 'OG_FETCH');

-- CreateEnum
CREATE TYPE "OgFetchStatus" AS ENUM ('NOT_ATTEMPTED', 'SUCCESS', 'PARTIAL_SUCCESS', 'FAILED');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "sourceUrl" TEXT,
ADD COLUMN     "imageSource" "ImageSource" NOT NULL DEFAULT 'MANUAL_UPLOAD',
ADD COLUMN     "descriptionSource" "ContentSource" NOT NULL DEFAULT 'MANUAL_UPLOAD',
ADD COLUMN     "ogImageUrl" TEXT,
ADD COLUMN     "ogFetchedAt" TIMESTAMP(3),
ADD COLUMN     "ogFetchStatus" "OgFetchStatus" NOT NULL DEFAULT 'NOT_ATTEMPTED';

-- CreateIndex
CREATE INDEX "products_ogFetchStatus_idx" ON "products"("ogFetchStatus");
