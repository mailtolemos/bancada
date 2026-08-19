/**
 * Logo bancada. — as bancadas de um estádio a subir, com a bola por cima.
 * O ponto verde do wordmark é a assinatura da marca.
 */
export function LogoIcon({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="bancada-bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2f9168" />
          <stop offset="1" stopColor="#12382b" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill="url(#bancada-bg)" />
      {/* Bancadas (três patamares a subir para a direita) */}
      <rect x="13" y="41" width="38" height="7.5" rx="2.5" fill="white" />
      <rect x="25.5" y="29.5" width="25.5" height="7.5" rx="2.5" fill="white" fillOpacity="0.92" />
      <rect x="38" y="18" width="13" height="7.5" rx="2.5" fill="white" fillOpacity="0.84" />
      {/* A bola sobre as bancadas — o "ponto" da marca */}
      <circle cx="19.5" cy="22" r="5.5" fill="#baf5d4" />
    </svg>
  );
}

export function Wordmark({ tagline, className = "" }: { tagline?: string; className?: string }) {
  return (
    <span className={`flex items-baseline font-black lowercase tracking-tight ${className}`}>
      <span>bancada</span>
      <span className="text-pitch-600 dark:text-pitch-400">.</span>
      {tagline && (
        <span className="ml-2.5 hidden max-w-56 truncate text-xs font-medium normal-case tracking-normal text-neutral-400 xl:inline">
          {tagline}
        </span>
      )}
    </span>
  );
}
