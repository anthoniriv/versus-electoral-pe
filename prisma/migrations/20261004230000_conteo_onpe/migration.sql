-- CreateTable
CREATE TABLE "ConteoOnpe" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "actualizado" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConteoOnpe_pkey" PRIMARY KEY ("id")
);

-- Only the app's Prisma connection uses this table; keep it off Supabase's public REST API.
ALTER TABLE "ConteoOnpe" ENABLE ROW LEVEL SECURITY;
