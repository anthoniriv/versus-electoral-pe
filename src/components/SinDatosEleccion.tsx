import Link from "next/link";

/**
 * Estado vacío para una elección cuyo padrón todavía no está cargado.
 * No inventamos candidatos: hasta que el JNE publique las listas inscritas,
 * la sección se muestra explícitamente como pendiente.
 */
export function SinDatosEleccion({
  titulo = "Padrón aún no disponible",
  detalle = "Cargaremos a los candidatos cuando el JNE publique las listas inscritas para las municipales 2026.",
  ctaHref = "/candidato",
  ctaLabel = "Ver candidatos presidenciales",
}: {
  titulo?: string;
  detalle?: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/40 px-6 py-12 text-center">
      <p className="text-sm sm:text-base font-black text-amber-400 uppercase tracking-wider">
        ⏳ {titulo}
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">{detalle}</p>
      <Link prefetch={false}
        href={ctaHref}
        className="mt-5 inline-block rounded-full bg-red-600/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-400 transition hover:bg-red-600/30"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
