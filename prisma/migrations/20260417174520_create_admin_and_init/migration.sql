-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'PRODUCER', 'DRIVER');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'ACCEPTED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LivestockStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD', 'IN_TRANSIT');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'IN_ESCROW', 'COMPLETED', 'REFUNDED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "document_type" TEXT DEFAULT 'CEDULA',
    "document_number" TEXT,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'PRODUCER',
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "finca_name" TEXT,
    "license_type" TEXT,
    "vehicle_capacity" DOUBLE PRECISION,
    "bio" TEXT,
    "avatar_url" TEXT,
    "location" geometry(Point, 4326),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Livestock" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "status" "LivestockStatus" NOT NULL DEFAULT 'AVAILABLE',
    "category" TEXT NOT NULL,
    "breed" TEXT,
    "weight" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price_per_lb" DOUBLE PRECISION NOT NULL,
    "total_price" DOUBLE PRECISION,
    "description" TEXT,
    "location" geometry(Point, 4326),
    "images_url" TEXT[],
    "guide_url" TEXT,
    "certificate_url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Livestock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreightOrder" (
    "id" TEXT NOT NULL,
    "livestockId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "driverId" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "price" DOUBLE PRECISION,
    "origin" geometry(Point, 4326) NOT NULL,
    "destination" geometry(Point, 4326) NOT NULL,
    "pickup_date" TIMESTAMP(3),
    "delivery_date" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FreightOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "payment_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "comment" TEXT,
    "reviewerId" TEXT NOT NULL,
    "revieweeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_document_number_key" ON "User"("document_number");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE INDEX "Profile_location_idx" ON "Profile" USING GIST ("location");

-- CreateIndex
CREATE INDEX "Livestock_location_idx" ON "Livestock" USING GIST ("location");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Livestock" ADD CONSTRAINT "Livestock_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreightOrder" ADD CONSTRAINT "FreightOrder_livestockId_fkey" FOREIGN KEY ("livestockId") REFERENCES "Livestock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreightOrder" ADD CONSTRAINT "FreightOrder_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreightOrder" ADD CONSTRAINT "FreightOrder_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
