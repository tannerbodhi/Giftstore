interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showWordmark = true, className = '' }: LogoProps) {
  const iconDimensions =
    size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
  const textClass =
    size === 'sm'
      ? 'text-lg'
      : size === 'lg'
      ? 'text-2xl'
      : 'text-xl';

  return (
    <span className={`inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 ${className}`}>
      <svg
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
        className={`${iconDimensions} shrink-0 drop-shadow-[0_2px_4px_rgba(58,42,34,0.14)]`}
      >
        <rect
          x="4"
          y="4"
          width="56"
          height="56"
          rx="14"
          fill="#FFFDF8"
          stroke="#3A2A22"
          strokeWidth="2.4"
        />
        <rect
          x="9"
          y="9"
          width="46"
          height="46"
          rx="9"
          fill="#D9B98B"
          fillOpacity="0.34"
          stroke="#3A2A22"
          strokeOpacity="0.18"
          strokeWidth="1.25"
        />
        <rect x="27.5" y="9" width="9" height="46" fill="#B3123A" />
        <rect x="9" y="27.5" width="46" height="9" fill="#B3123A" />
        <circle cx="32" cy="32" r="12" fill="#E8B93A" stroke="#3A2A22" strokeWidth="1.75" />
        <circle
          cx="32"
          cy="32"
          r="8.5"
          fill="none"
          stroke="#3A2A22"
          strokeOpacity="0.35"
          strokeWidth="1"
        />
        <path
          d="M35.5 29.5C34.8 28.1 33.4 27.3 31.8 27.3C29.1 27.3 27.3 29.4 27.3 32C27.3 34.7 29.1 36.7 31.9 36.7C34.2 36.7 35.8 35.4 36.1 33.2H32.2"
          stroke="#3A2A22"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showWordmark && (
        <span className={`font-serif font-semibold tracking-tight text-cocoa ${textClass}`}>
          Giftstore
        </span>
      )}
    </span>
  );
}
