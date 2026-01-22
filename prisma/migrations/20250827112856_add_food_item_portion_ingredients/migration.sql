-- CreateTable
CREATE TABLE "public"."food_item_portion_ingredients" (
    "id" TEXT NOT NULL,
    "foodItemPortionId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "food_item_portion_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "food_item_portion_ingredients_foodItemPortionId_ingredientI_key" ON "public"."food_item_portion_ingredients"("foodItemPortionId", "ingredientId");

-- AddForeignKey
ALTER TABLE "public"."food_item_portion_ingredients" ADD CONSTRAINT "food_item_portion_ingredients_foodItemPortionId_fkey" FOREIGN KEY ("foodItemPortionId") REFERENCES "public"."food_item_portions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."food_item_portion_ingredients" ADD CONSTRAINT "food_item_portion_ingredients_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "public"."ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
