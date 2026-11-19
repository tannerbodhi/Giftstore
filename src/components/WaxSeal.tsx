import { motion } from 'framer-motion';

interface WaxSealProps {
  variant?: 'gold' | 'crimson';
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  cracked?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
}

export function WaxSeal({
  variant = 'gold',
  size = 'md',
  interactive = false,
  cracked = false,
  onClick,
  ariaLabel = 'Wax seal',
  className = '',
}: WaxSealProps) {
  const sizeClass =
    size === 'sm'
      ? 'w-11 h-11'
      : size === 'lg'
      ? 'w-20 h-20'
      : 'w-14 h-14';

  const sealBg = variant === 'crimson' ? 'wax-seal-crimson text-white' : 'wax-seal-gold text-cocoa';
  const strokeColor = variant === 'crimson' ? 'rgba(255,255,255,0.75)' : 'rgba(58,42,34,0.82)';

  const content = (
    <span
      className={`relative inline-flex items-center justify-center rounded-full select-none ${sizeClass} ${sealBg} ${className}`}
    >
      {/* Organic outer wax rim accent */}
      <svg
        viewBox="0 0 80 80"
        fill="none"
        aria-hidden="true"
        className="w-full h-full pointer-events-none"
      >
        <circle
          cx="40"
          cy="40"
          r="33"
          stroke={strokeColor}
          strokeOpacity="0.28"
          strokeWidth="1.5"
          strokeDasharray="3 2"
        />
        <circle
          cx="40"
          cy="40"
          r="26"
          stroke={strokeColor}
          strokeOpacity="0.4"
          strokeWidth="1.2"
        />
        {/* Debossed G Monogram */}
        <path
          d="M46.5 34.5C45.2 31.6 42.4 29.8 39.1 29.8C33.8 29.8 30.2 34.1 30.2 40C30.2 45.9 33.9 50.2 39.4 50.2C44.2 50.2 47.4 47.4 47.9 42.6H40.2"
          stroke={strokeColor}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );

  if (interactive) {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        whileHover={cracked ? undefined : { scale: 1.06, rotate: -3 }}
        whileTap={cracked ? undefined : { scale: 0.94 }}
        animate={cracked ? { scale: 0.86, opacity: 0.45, rotate: 14 } : { scale: 1, opacity: 1, rotate: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crimson focus-visible:ring-offset-2 focus-visible:ring-offset-tissue cursor-pointer"
      >
        {content}
      </motion.button>
    );
  }

  return content;
}
