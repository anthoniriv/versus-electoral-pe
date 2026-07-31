-- Multi-elección: los candidatos existentes quedan como presidenciales.
ALTER TABLE "Candidato" ADD COLUMN "eleccion" TEXT NOT NULL DEFAULT 'presidencial-2026';
ALTER TABLE "Candidato" ADD COLUMN "ambito" TEXT;

CREATE INDEX "Candidato_eleccion_idx" ON "Candidato"("eleccion");
CREATE INDEX "Candidato_eleccion_ambito_idx" ON "Candidato"("eleccion", "ambito");
