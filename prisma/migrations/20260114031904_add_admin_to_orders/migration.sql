-- DropForeignKey
ALTER TABLE "public"."orders" DROP CONSTRAINT "orders_staffId_fkey";

-- AlterTable
ALTER TABLE "public"."orders" ADD COLUMN     "adminId" TEXT,
ALTER COLUMN "staffId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
