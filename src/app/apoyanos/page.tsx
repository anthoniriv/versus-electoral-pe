import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";
import { KofiDonateCard } from "@/components/KofiDonateCard";

export const metadata: Metadata = {
  title: `Apóyanos | ${SITE_NAME}`,
  description:
    "Conoce al equipo detrás de Versus Electoral Perú, nuestra misión y cómo puedes apoyar el proyecto.",
};

export default function ApoyanosPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <section className="relative py-12 sm:py-16 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-gray-950/50 to-gray-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(220,38,38,0.08),transparent_70%)]" />
        <div className="relative mx-auto max-w-3xl">
          <p className="text-red-500 text-[11px] font-bold uppercase tracking-[0.35em] mb-3 animate-fade-in">
            Proyecto independiente
          </p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
            <span className="text-white">Apóyanos</span>
          </h1>
          <p className="mt-4 text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Somos un equipo independiente que cree en la transparencia electoral.
            Conoce quiénes somos y cómo puedes ayudarnos a seguir adelante.
          </p>
        </div>
      </section>

      {/* Quiénes somos */}
      <section className="py-16 px-4 border-t border-gray-800/40">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-xl font-black mb-6 text-center uppercase tracking-[0.2em] text-white">
            Quiénes Somos
          </h2>
          <div className="rounded-2xl border border-gray-800/60 bg-gray-900/40 backdrop-blur-sm p-6 sm:p-8">
            <p className="text-gray-300 leading-relaxed">
              Somos{" "}
              <a
                href="https://www.onilabs.site/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-500 hover:text-red-400 font-semibold transition-colors"
              >
                OniLabs
              </a>
              , un equipo de desarrollo enfocado en crear soluciones tecnológicas
              con impacto social. Nos apasiona usar la tecnología para resolver
              problemas reales y generar herramientas que empoderen a los
              ciudadanos con información clara y accesible.
            </p>
          </div>
        </div>
      </section>

      {/* Nuestra misión */}
      <section className="py-16 px-4 border-t border-gray-800/40">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-xl font-black mb-6 text-center uppercase tracking-[0.2em] text-white">
            Nuestra Misión
          </h2>
          <div className="rounded-2xl border border-gray-800/60 bg-gray-900/40 backdrop-blur-sm p-6 sm:p-8">
            <p className="text-gray-300 leading-relaxed">
              Con <strong className="text-white">Versus Electoral Perú</strong>{" "}
              buscamos que cada ciudadano pueda acceder de forma rápida y
              transparente al historial público de los candidatos presidenciales.
              Recopilamos, clasificamos y presentamos noticias de fuentes
              periodísticas verificadas para que votes informado.
            </p>
            <p className="mt-4 text-gray-400 leading-relaxed">
              Creemos que la democracia se fortalece cuando la información es
              abierta. Nuestro objetivo es reducir la asimetría informativa en
              los procesos electorales y ofrecer una herramienta objetiva, sin
              sesgos partidarios ni intereses políticos.
            </p>
          </div>
        </div>
      </section>

      {/* Onigrowth */}
      <section className="relative py-20 px-4 border-t border-gray-800/40 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.04),transparent_70%)]" />
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="text-red-500 text-[11px] font-bold uppercase tracking-[0.35em] mb-4">
            Nuestro Producto
          </p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-[1.1] text-white">
            Deja de adivinar qué
            <br />
            <span className="text-red-500">pedirle a la IA</span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-gray-400 max-w-xl mx-auto leading-relaxed">
            Onigrowth es un kit de prompts y plantillas estratégicas para
            emprendedores que quieren usar la IA como herramienta real de
            crecimiento para su negocio.
          </p>

          {/* Badges de compatibilidad */}
          <div className="mt-6 inline-flex items-center gap-3 sm:gap-4 rounded-full border border-gray-800/60 bg-gray-900/50 px-5 py-2.5">
            <span className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Compatible con</span>
            <div className="h-4 w-px bg-gray-700/60" />
            <span className="text-xs font-bold text-gray-300">ChatGPT</span>
            <span className="text-xs font-bold text-gray-300">Claude</span>
            <span className="text-xs font-bold text-gray-300">Gemini</span>
          </div>

          {/* Feature grid */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              {
                title: "Blueprint Lead Magnet",
                svg: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
              },
              {
                title: "Blueprints Carrusel IG",
                svg: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></svg>,
              },
              {
                title: "Scripts de Ventas",
                svg: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>,
              },
              {
                title: "Calendario Contenido",
                svg: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>,
              },
              {
                title: "Marco Estratégico",
                svg: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" /></svg>,
              },
              {
                title: "Plantillas de Copy",
                svg: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>,
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-gray-800/60 bg-gray-900/40 p-4 text-center flex flex-col items-center"
              >
                <div className="mb-2 text-red-500">{item.svg}</div>
                <p className="text-xs font-semibold text-gray-300 leading-tight">
                  {item.title}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <a
            href="https://www.onigrowth.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-8 inline-flex items-center gap-2.5 rounded-xl bg-red-600 px-7 py-3.5 text-sm font-bold text-white uppercase tracking-wider transition-all duration-300 hover:bg-red-500 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(220,38,38,0.25)]"
          >
            Obtener Mi Kit
            <svg
              className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </a>
        </div>
      </section>

      {/* Apoya el proyecto */}
      <section className="py-16 px-4 border-t border-gray-800/40">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-xl font-black mb-6 text-center uppercase tracking-[0.2em] text-white">
            Apoya el Proyecto
          </h2>
          <div className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-950/30 to-gray-900/80 p-6 sm:p-8">
            <p className="text-gray-300 leading-relaxed text-center">
              Versus Electoral Perú es un proyecto{" "}
              <strong className="text-white">100% independiente</strong>. No
              recibimos financiamiento de ningún partido político, campaña
              electoral ni entidad gubernamental. Tu aporte nos permite cubrir
              los costos de servidores, desarrollo y mantenimiento.
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Plin / Yape */}
              <div className="rounded-xl border border-gray-800/60 bg-gray-900/60 p-5 text-center">
                <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-3">
                  Plin / Yape
                </h3>
                <img
                  src="/yape.jpeg"
                  alt="QR Yape para apoyar el proyecto"
                  className="mx-auto w-48 h-56 rounded-lg object-contain"
                />
                <p className="mt-3 text-gray-400 text-xs leading-relaxed">
                  Escanea el QR desde tu billetera digital favorita.
                </p>
              </div>

              {/* Ko-fi */}
              <KofiDonateCard />
            </div>
          </div>
        </div>
      </section>

      {/* Redes sociales */}
      <section className="py-16 px-4 border-t border-gray-800/40">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-xl font-black mb-3 uppercase tracking-[0.2em] text-white">
            Síguenos
          </h2>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed max-w-lg mx-auto">
            Mantente al día con nuestras actualizaciones, análisis y nuevos
            proyectos. Encuéntranos en nuestras redes sociales.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/company/onilabs"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2.5 rounded-xl border border-gray-800/60 bg-gray-900/40 px-5 py-3 transition-all duration-300 hover:border-gray-500/60 hover:bg-gray-900/70"
            >
              <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              <span className="text-sm font-semibold text-gray-300 group-hover:text-white transition-colors">
                LinkedIn
              </span>
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/onilabs"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2.5 rounded-xl border border-gray-800/60 bg-gray-900/40 px-5 py-3 transition-all duration-300 hover:border-gray-500/60 hover:bg-gray-900/70"
            >
              <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
              <span className="text-sm font-semibold text-gray-300 group-hover:text-white transition-colors">
                Instagram
              </span>
            </a>

            {/* TikTok */}
            <a
              href="https://www.tiktok.com/@onilabs"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2.5 rounded-xl border border-gray-800/60 bg-gray-900/40 px-5 py-3 transition-all duration-300 hover:border-gray-500/60 hover:bg-gray-900/70"
            >
              <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
              </svg>
              <span className="text-sm font-semibold text-gray-300 group-hover:text-white transition-colors">
                TikTok
              </span>
            </a>

            {/* Website */}
            <a
              href="https://www.onilabs.site/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2.5 rounded-xl border border-gray-800/60 bg-gray-900/40 px-5 py-3 transition-all duration-300 hover:border-gray-500/60 hover:bg-gray-900/70"
            >
              <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              <span className="text-sm font-semibold text-gray-300 group-hover:text-white transition-colors">
                Website
              </span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
