"use client";

import { useState } from "react";
import { fotoDeCandidato } from "@/lib/fotos-candidatos";

interface CandidatoAvatarProps {
  slug: string;
  nombre: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  fill?: boolean;
}

export function CandidatoAvatar({ slug, nombre, size = 160, className = "", style, fill = false }: CandidatoAvatarProps) {
  // El manifiesto se genera en el build a partir de public/candidatos, así que
  // los slugs sin foto van directo a las iniciales. Antes se sondeaban las
  // extensiones una por una y cada candidato sin imagen disparaba 4 respuestas
  // 404 que la CDN no cachea.
  const src = fotoDeCandidato(slug);
  const [slugRoto, setSlugRoto] = useState<string | null>(null);
  const mostrarFoto = src !== null && slugRoto !== slug;

  return (
    <div
      className={`relative overflow-hidden bg-gray-800 ${className}`}
      style={{ width: fill ? "100%" : size, height: fill ? "100%" : size, ...style }}
    >
      {mostrarFoto ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src}
          // Decorativo: el nombre va al lado.
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
          onError={() => setSlugRoto(slug)}
        />
      ) : (
        <div className="flex items-center justify-center h-full w-full text-gray-400 font-black"
          style={{ fontSize: size * 0.3 }}
        >
          {nombre.split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase()}
        </div>
      )}
    </div>
  );
}
