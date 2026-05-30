/*
  Warnings:

  - You are about to drop the column `videos` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "videos",
ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "products_views_idx" ON "products"("views");

-- CreateIndex
CREATE INDEX "products_status_views_idx" ON "products"("status", "views");
