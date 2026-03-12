"use client";

import { useState } from "react";

interface CandidatoAvatarProps {
  slug: string;
  nombre: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function CandidatoAvatar({ slug, nombre, size = 160, className = "", style }: CandidatoAvatarProps) {
  const [src, setSrc] = useState(`/candidatos/${slug}.jpg`);
  const [fallback, setFallback] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-gray-800 ${className}`} style={{ width: size, height: size, ...style }}>
      {!fallback ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src}
          alt={nombre}
          width={size}
          height={size}
          className="w-full h-full object-cover"
          onError={() => {
            if (src.endsWith(".jpg")) {
              setSrc(`/candidatos/${slug}.svg`);
            } else {
              setFallback(true);
            }
          }}
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
