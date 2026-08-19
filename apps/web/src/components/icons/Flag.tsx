/**
 * Bandeiras SVG reais (country-flag-icons) e emblemas de competição.
 * Nada de emojis: renderização consistente em todas as plataformas.
 */
import AR from "country-flag-icons/react/3x2/AR";
import BR from "country-flag-icons/react/3x2/BR";
import DE from "country-flag-icons/react/3x2/DE";
import ES from "country-flag-icons/react/3x2/ES";
import EU from "country-flag-icons/react/3x2/EU";
import FR from "country-flag-icons/react/3x2/FR";
import GBENG from "country-flag-icons/react/3x2/GB-ENG";
import IT from "country-flag-icons/react/3x2/IT";
import MX from "country-flag-icons/react/3x2/MX";
import NL from "country-flag-icons/react/3x2/NL";
import PT from "country-flag-icons/react/3x2/PT";
import SA from "country-flag-icons/react/3x2/SA";
import US from "country-flag-icons/react/3x2/US";
import GB from "country-flag-icons/react/3x2/GB";

type FlagComponent = typeof PT;

const FLAGS: Record<string, FlagComponent> = {
  AR,
  BR,
  DE,
  ES,
  EU,
  FR,
  "GB-ENG": GBENG,
  GB,
  IT,
  MX,
  NL,
  PT,
  SA,
  US,
};

export function Flag({
  code,
  size = 16,
  className = "",
}: {
  code: string;
  size?: number;
  className?: string;
}) {
  const Component = FLAGS[code.toUpperCase()];
  if (!Component) return null;
  return (
    <Component
      aria-hidden
      className={`inline-block shrink-0 rounded-[2px] ${className}`}
      style={{ width: size, height: (size * 2) / 3 }}
    />
  );
}

export function hasFlag(code: string | undefined): boolean {
  return Boolean(code && FLAGS[code.toUpperCase()]);
}
