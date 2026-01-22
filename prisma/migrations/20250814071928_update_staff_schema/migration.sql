/*
  Warnings:

  - You are about to drop the `kitchen` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `waiters` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."StaffRole" AS ENUM ('WAITER', 'KITCHEN', 'MANAGER');

-- DropTable
DROP TABLE "public"."kitchen";

-- DropTable
DROP TABLE "public"."waiters";

-- CreateTable
CREATE TABLE "public"."staff" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "public"."StaffRole" NOT NULL,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "supabaseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_email_key" ON "public"."staff"("email");

-- CreateIndex
CREATE UNIQUE INDEX "staff_supabaseId_key" ON "public"."staff"("supabaseId");
