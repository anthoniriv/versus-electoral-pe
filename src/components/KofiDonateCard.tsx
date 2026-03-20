"use client";

import { useState, useEffect } from "react";

export function KofiDonateCard() {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showModal]);

  const KOFI_URL = "https://ko-fi.com/onilabs";

  function handleDonate() {
    setShowModal(true);
  }

  function handleCloseModal() {
    setShowModal(false);
    window.open(KOFI_URL, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <button
        onClick={handleDonate}
        className="group rounded-xl border border-gray-800/60 bg-gray-900/60 p-5 text-center transition-all duration-300 hover:border-red-500/40 hover:bg-gray-900/80 w-full cursor-pointer"
      >
        <div className="text-2xl mb-2">☕</div>
        <h3 className="font-bold text-white text-sm uppercase tracking-wider">
          Ko-fi
        </h3>
        <p className="mt-2 text-gray-400 text-xs leading-relaxed">
          Invítanos un café con tarjeta o PayPal desde cualquier país.
        </p>
        <span className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-600/20 text-red-400 text-xs font-bold uppercase tracking-wider group-hover:bg-red-600/30 transition-colors">
          Donar en Ko-fi
          <svg
            className="w-3 h-3 group-hover:translate-x-0.5 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </span>
      </button>

      {/* Modal de agradecimiento */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/90 backdrop-blur-sm px-4 animate-fade-in"
          onClick={handleCloseModal}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-gray-800/60 bg-gray-900 p-8 sm:p-10 text-center shadow-[0_0_80px_rgba(220,38,38,0.1)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón cerrar */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors cursor-pointer"
              aria-label="Cerrar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Icono corazón */}
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
              <svg className="w-10 h-10 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
            </div>

            {/* Texto */}
            <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider">
              Thank you!
            </h3>
            <p className="mt-4 text-gray-400 text-sm leading-relaxed">
              Tu generosidad nos impulsa a seguir construyendo herramientas que
              promuevan la transparencia electoral en el Perú. Cada aporte, sin
              importar el monto, marca una diferencia real para mantener este
              proyecto independiente y al servicio de todos los ciudadanos.
            </p>

            {/* Botón OK */}
            <button
              onClick={handleCloseModal}
              className="mt-8 inline-flex items-center justify-center rounded-xl bg-red-600 px-8 py-3 text-sm font-bold text-white uppercase tracking-wider transition-all duration-300 hover:bg-red-500 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(220,38,38,0.25)] cursor-pointer"
            >
              OK, entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
