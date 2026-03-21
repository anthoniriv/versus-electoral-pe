import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";
import { NewsBanner } from "@/components/NewsBanner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const TITLE = `${SITE_NAME} — Versus de Candidatos Presidenciales 2026`;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#030712",
};

export const metadata: Metadata = {
  title: {
    default: TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: SITE_URL,
    languages: {
      "x-default": SITE_URL,
      es: SITE_URL,
      "es-PE": SITE_URL,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_PE",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icon.png`,
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: "es",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}/#webpage`,
      url: SITE_URL,
      name: TITLE,
      description: SITE_DESCRIPTION,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "es",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-950 text-white`}
      >
        <header className="sticky top-0 z-50 border-b border-gray-800/80 bg-gray-950/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-3 sm:px-6">
            <a href="/" className="flex items-center gap-1.5 group">
              <span className="text-lg sm:text-xl font-black text-red-500 uppercase tracking-wider group-hover:text-red-400 transition-colors">
                Versus
              </span>
              <span className="text-lg sm:text-xl font-black text-white uppercase tracking-wider">
                Electoral Perú
              </span>
            </a>
          </div>
        </header>
        <NewsBanner />
        <main>{children}</main>
        <footer className="border-t border-gray-800/60 py-10 text-center text-xs text-gray-600">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <p className="font-bold text-gray-400 tracking-wider uppercase text-[11px]">{SITE_NAME}</p>
            <p className="mt-2 max-w-xl mx-auto leading-relaxed">Información recopilada de fuentes periodísticas públicas. Las clasificaciones son automáticas y no constituyen juicio legal.</p>
            <p className="mt-1 text-gray-700">Actualización automática cada 24 horas (00:00, hora Perú).</p>
            <p className="mt-4 text-gray-500">Trabajo realizado por <a href="https://www.onilabs.site/" target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-400 font-semibold transition-colors">OniLabs</a></p>
          </div>
        </footer>
      </body>
    </html>
  );
}
