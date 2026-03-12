import Link from "next/link";
import { GRAVEDAD, type GravedadKey } from "@/lib/candidatos";
import { GravedadBadge } from "./GravedadBadge";

interface CandidatoCardProps {
  nombre: string;
  partido: string;
  slug: string;
  totalNoticias: number;
  peorGravedad: string;
  gravedadCounts: Record<string, number>;
}

export function CandidatoCard({
  nombre,
  partido,
  slug,
  totalNoticias,
  peorGravedad,
  gravedadCounts,
}: CandidatoCardProps) {
  const info = GRAVEDAD[peorGravedad as GravedadKey] || GRAVEDAD.LIMPIO;

  return (
    <Link
      href={`/candidato/${slug}`}
      className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-gray-300 dark:bg-gray-900 dark:border-gray-700"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {nombre}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 truncate">
            {partido}
          </p>
        </div>
        <GravedadBadge gravedad={peorGravedad} />
      </div>

      <div className="mt-4 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
        <span>{totalNoticias} noticia{totalNoticias !== 1 ? "s" : ""}</span>
        {Object.entries(gravedadCounts).map(([g, count]) => (
          <span key={g} className="flex items-center gap-1">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: GRAVEDAD[g as GravedadKey]?.color }}
            />
            {count}
          </span>
        ))}
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className="h-full rounded-full transition-all"
          style={{
            backgroundColor: info.color,
            width: totalNoticias > 0 ? "100%" : "0%",
            opacity: totalNoticias > 0 ? 0.7 : 0,
          }}
        />
      </div>
    </Link>
  );
}
