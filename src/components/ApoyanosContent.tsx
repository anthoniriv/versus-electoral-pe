"use client";

import { useState } from "react";
import { KofiDonateCard } from "./KofiDonateCard";
import { OnigrowthModal } from "./OnigrowthModal";

export function ApoyanosContent() {
  const [showOnigrowth, setShowOnigrowth] = useState(false);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero: quiénes somos + misión */}
      <section className="relative py-10 sm:py-14 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-gray-950/50 to-gray-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(220,38,38,0.08),transparent_70%)]" />
        <div className="relative mx-auto max-w-2xl">
          <p className="text-red-500 text-[11px] font-bold uppercase tracking-[0.35em] mb-3 animate-fade-in">
            Proyecto independiente
          </p>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.05]">
            <span className="text-white">Apóyanos</span>
          </h1>
          <p className="mt-4 text-sm sm:text-base text-gray-400 max-w-xl mx-auto leading-relaxed">
            Somos{" "}
            <a
              href="https://www.onilabs.site/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-500 hover:text-red-400 font-bold transition-colors"
            >
              OniLabs
            </a>
            , un equipo de desarrollo enfocado en crear soluciones tecnológicas
            con impacto social. Conoce nuestro último producto:{" "}
            <button
              onClick={() => setShowOnigrowth(true)}
              className="font-bold text-[#39FF14] hover:text-[#32e012] transition-colors cursor-pointer"
            >
              OniGrowth
            </button>.
          </p>
          <p className="mt-3 text-sm sm:text-base text-gray-400 max-w-xl mx-auto leading-relaxed">
            Con <strong className="text-white">Versus Electoral Perú</strong> buscamos
            que cada ciudadano acceda de forma rápida y transparente al historial
            público de los candidatos presidenciales, con información de fuentes
            periodísticas verificadas, sin sesgos partidarios ni intereses políticos.
          </p>
        </div>
      </section>

      {/* Apoya el proyecto — inmediatamente visible */}
      <section className="py-10 sm:py-14 px-4 border-t border-gray-800/40">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-xl font-black mb-2 text-center uppercase tracking-[0.2em] text-white">
            Apoya el Proyecto
          </h2>
          <p className="text-gray-400 text-sm text-center mb-6 max-w-lg mx-auto leading-relaxed">
            Somos <strong className="text-white">100% independientes</strong>. No
            recibimos financiamiento de ningún partido político ni entidad
            gubernamental. Tu aporte cubre servidores, desarrollo y mantenimiento.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Plin / Yape */}
            <div className="rounded-xl border border-gray-800/60 bg-gray-900/60 p-5 text-center">
              <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-3">
                Plin / Yape
              </h3>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/yape.jpeg"
                alt="QR Yape para apoyar el proyecto"
                className="mx-auto w-48 h-56 object-contain rounded-[15px]"
              />
              <p className="mt-3 text-gray-400 text-xs leading-relaxed">
                Escanea el QR desde tu billetera digital favorita.
              </p>
            </div>

            {/* Ko-fi */}
            <KofiDonateCard />
          </div>
        </div>
      </section>

      {/* Síguenos — compacto */}
      <section className="py-10 sm:py-14 px-4 border-t border-gray-800/40">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-xl font-black mb-3 uppercase tracking-[0.2em] text-white">
            Síguenos
          </h2>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed max-w-lg mx-auto">
            Mantente al día con nuestras actualizaciones y nuevos proyectos.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/company/onilabs-dev"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 rounded-xl border border-gray-800/60 bg-gray-900/40 px-4 py-2.5 transition-all duration-300 hover:border-gray-500/60 hover:bg-gray-900/70"
            >
              <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              <span className="text-sm font-semibold text-gray-300 group-hover:text-white transition-colors">
                LinkedIn
              </span>
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/onilabs.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 rounded-xl border border-gray-800/60 bg-gray-900/40 px-4 py-2.5 transition-all duration-300 hover:border-gray-500/60 hover:bg-gray-900/70"
            >
              <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
              <span className="text-sm font-semibold text-gray-300 group-hover:text-white transition-colors">
                Instagram
              </span>
            </a>

            {/* TikTok */}
            <a
              href="https://www.tiktok.com/@onilabs_dev"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 rounded-xl border border-gray-800/60 bg-gray-900/40 px-4 py-2.5 transition-all duration-300 hover:border-gray-500/60 hover:bg-gray-900/70"
            >
              <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
              </svg>
              <span className="text-sm font-semibold text-gray-300 group-hover:text-white transition-colors">
                TikTok
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* Onigrowth Modal */}
      <OnigrowthModal open={showOnigrowth} onClose={() => setShowOnigrowth(false)} />
    </div>
  );
}
