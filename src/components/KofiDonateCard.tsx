const KOFI_URL = "https://ko-fi.com/onilabs";

/** Donation card that opens Ko-fi directly in a new tab. */
export function KofiDonateCard() {
  return (
    <a
      href={KOFI_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full w-full flex-col items-center justify-center rounded-xl border border-gray-800/60 bg-gray-900/60 p-5 text-center transition-[border-color,background-color,transform] duration-150 ease-out [@media(hover:hover)_and_(pointer:fine)]:hover:border-red-500/40 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-gray-900/80 active:scale-[0.98]"
    >
      <div className="text-2xl mb-2" aria-hidden="true">☕</div>
      <h2 className="font-bold text-white text-sm uppercase tracking-wider">
        Ko-fi
      </h2>
      <p className="mt-2 text-gray-400 text-xs leading-relaxed">
        Invítanos un café con tarjeta o PayPal desde cualquier país.
      </p>
      <span className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-600/20 text-red-400 text-xs font-bold uppercase tracking-wider transition-colors duration-150 [@media(hover:hover)_and_(pointer:fine)]:group-hover:bg-red-600/30">
        Donar en Ko-fi
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5h5v5M19 5l-8 8M10 7H6a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1v-4" />
        </svg>
        <span className="sr-only">(se abre en otra pestaña)</span>
      </span>
    </a>
  );
}
