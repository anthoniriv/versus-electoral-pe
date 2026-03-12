-- CreateTable
CREATE TABLE "Candidato" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "partido" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Noticia" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fuente" TEXT NOT NULL,
    "gravedad" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "candidatoId" INTEGER NOT NULL,
    "fechaNoticia" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Noticia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrapingLog" (
    "id" SERIAL NOT NULL,
    "fuente" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "mensaje" TEXT,
    "noticias" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScrapingLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Candidato_slug_key" ON "Candidato"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Noticia_url_key" ON "Noticia"("url");

-- CreateIndex
CREATE INDEX "Noticia_candidatoId_idx" ON "Noticia"("candidatoId");

-- CreateIndex
CREATE INDEX "Noticia_gravedad_idx" ON "Noticia"("gravedad");

-- CreateIndex
CREATE INDEX "Noticia_tipo_idx" ON "Noticia"("tipo");

-- AddForeignKey
ALTER TABLE "Noticia" ADD CONSTRAINT "Noticia_candidatoId_fkey" FOREIGN KEY ("candidatoId") REFERENCES "Candidato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
