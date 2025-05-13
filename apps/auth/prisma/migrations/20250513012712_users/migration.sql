-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'DELIVERY');

-- CreateTable
CREATE TABLE "Avatar" (
    "id" SERIAL NOT NULL,
    "publicId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "avatarUserId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Avatar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "address" TEXT,
    "roles" "Role" DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "rememberMe" BOOLEAN DEFAULT false,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activation" (
    "id" SERIAL NOT NULL,
    "activationCode" TEXT,
    "activationToken" TEXT,
    "requestedEmail" TEXT,
    "twoFactorSecret" TEXT,
    "twoFactorActivated" BOOLEAN DEFAULT false,
    "activationUserId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Avatar_avatarUserId_key" ON "Avatar"("avatarUserId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Activation_activationUserId_key" ON "Activation"("activationUserId");

-- AddForeignKey
ALTER TABLE "Avatar" ADD CONSTRAINT "Avatar_avatarUserId_fkey" FOREIGN KEY ("avatarUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activation" ADD CONSTRAINT "Activation_activationUserId_fkey" FOREIGN KEY ("activationUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
