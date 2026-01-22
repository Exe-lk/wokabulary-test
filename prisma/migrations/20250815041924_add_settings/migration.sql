-- CreateTable
CREATE TABLE "public"."settings" (
    "id" TEXT NOT NULL,
    "serviceChargeRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "theme" TEXT NOT NULL DEFAULT 'blue',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);
