-- CreateTable
CREATE TABLE "AdminInviteKey" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "AdminInviteKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminInviteKey_key_key" ON "AdminInviteKey"("key");
