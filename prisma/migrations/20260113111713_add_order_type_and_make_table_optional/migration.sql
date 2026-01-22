-- CreateEnum
CREATE TYPE "public"."OrderType" AS ENUM ('DINE_IN', 'TAKEAWAY', 'ONLINE_ORDER');

-- AlterTable
ALTER TABLE "public"."orders" ADD COLUMN     "orderType" "public"."OrderType" NOT NULL DEFAULT 'DINE_IN',
ALTER COLUMN "tableNumber" DROP NOT NULL;
