-- CreateTable
CREATE TABLE "void_sales" (
    "id" TEXT NOT NULL,
    "sale_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "total_voided" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cashier_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "void_sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "void_sale_items" (
    "id" TEXT NOT NULL,
    "void_sale_id" TEXT NOT NULL,
    "sale_item_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "void_sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_adjustments" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "previous_stock" INTEGER NOT NULL,
    "new_stock" INTEGER NOT NULL,
    "cost" DOUBLE PRECISION,
    "total_cost" DOUBLE PRECISION,
    "reason" TEXT NOT NULL,
    "note" TEXT,
    "cashier_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "void_sales_sale_id_idx" ON "void_sales"("sale_id");

-- CreateIndex
CREATE INDEX "void_sale_items_void_sale_id_idx" ON "void_sale_items"("void_sale_id");

-- CreateIndex
CREATE INDEX "inventory_adjustments_product_id_idx" ON "inventory_adjustments"("product_id");

-- CreateIndex
CREATE INDEX "inventory_adjustments_cashier_id_idx" ON "inventory_adjustments"("cashier_id");

-- AddForeignKey
ALTER TABLE "void_sales" ADD CONSTRAINT "void_sales_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "void_sales" ADD CONSTRAINT "void_sales_cashier_id_fkey" FOREIGN KEY ("cashier_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "void_sale_items" ADD CONSTRAINT "void_sale_items_void_sale_id_fkey" FOREIGN KEY ("void_sale_id") REFERENCES "void_sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_cashier_id_fkey" FOREIGN KEY ("cashier_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
