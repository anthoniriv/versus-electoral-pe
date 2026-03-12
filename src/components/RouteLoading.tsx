"use client";

import { useEffect, useRef } from "react";
import lottie from "lottie-web";

interface RouteLoadingProps {
  message?: string;
}

export function RouteLoading({ message = "Cargando informacion..." }: RouteLoadingProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const animation = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      path: "/lottie/page-loading.json",
    });

    return () => animation.destroy();
  }, []);

  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4">
      <div className="w-full max-w-xs rounded-2xl border border-gray-800 bg-gray-900/60 p-6 text-center backdrop-blur-sm">
        <div ref={containerRef} className="mx-auto h-28 w-28" aria-hidden />
        <p className="mt-2 text-sm text-gray-300">{message}</p>
      </div>
    </div>
  );
}
