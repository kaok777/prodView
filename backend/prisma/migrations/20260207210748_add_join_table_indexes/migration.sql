-- CreateIndex
CREATE INDEX "product_categories_categoryId_idx" ON "product_categories"("categoryId");

-- CreateIndex
CREATE INDEX "product_categories_productId_idx" ON "product_categories"("productId");

-- CreateIndex
CREATE INDEX "product_use_cases_useCaseId_idx" ON "product_use_cases"("useCaseId");

-- CreateIndex
CREATE INDEX "product_use_cases_productId_idx" ON "product_use_cases"("productId");
