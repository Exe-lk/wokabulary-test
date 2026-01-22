/*
  Warnings:

  - You are about to drop the column `portionId` on the `food_items` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `food_items` table. All the data in the column will be lost.
  - Added the required column `categoryId` to the `food_items` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."food_items" DROP CONSTRAINT "food_items_portionId_fkey";

-- AlterTable
ALTER TABLE "public"."food_items" DROP COLUMN "portionId",
DROP COLUMN "price",
ADD COLUMN     "categoryId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."food_item_portions" (
    "id" TEXT NOT NULL,
    "foodItemId" TEXT NOT NULL,
    "portionId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "food_item_portions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "public"."categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "food_item_portions_foodItemId_portionId_key" ON "public"."food_item_portions"("foodItemId", "portionId");

-- AddForeignKey
ALTER TABLE "public"."food_items" ADD CONSTRAINT "food_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."food_item_portions" ADD CONSTRAINT "food_item_portions_foodItemId_fkey" FOREIGN KEY ("foodItemId") REFERENCES "public"."food_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."food_item_portions" ADD CONSTRAINT "food_item_portions_portionId_fkey" FOREIGN KEY ("portionId") REFERENCES "public"."portions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
