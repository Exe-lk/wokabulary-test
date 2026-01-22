/*
  Warnings:

  - Added the required column `paymentMode` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."PaymentMode" AS ENUM ('CASH', 'CARD');

-- AlterTable
ALTER TABLE "public"."payments" ADD COLUMN     "paymentMode" "public"."PaymentMode" NOT NULL;
