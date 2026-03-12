import { GRAVEDAD, type GravedadKey } from "@/lib/candidatos";

export function GravedadBadge({ gravedad }: { gravedad: string }) {
  const info = GRAVEDAD[gravedad as GravedadKey] || GRAVEDAD.LIMPIO;

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide"
      style={{ backgroundColor: `${info.color}15`, color: info.color, border: `1px solid ${info.color}25` }}
    >
      {info.label}
    </span>
  );
}
