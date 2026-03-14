export function NepalFlagIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14 6L48 24L30 26L50 58L14 46V6Z"
        fill="#DC143C"
        stroke="#1D4ED8"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <circle cx="28" cy="22" r="5" fill="white" />
      <path
        d="M31 22A5 5 0 0 1 21 22"
        stroke="#DC143C"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="30" cy="42" r="6" fill="white" />
      <path
        d="M39 42L35.8 43.3L36.8 46.6L34 44.7L32 47.5L30 44.7L27.2 46.6L28.2 43.3L25 42L28.2 40.7L27.2 37.4L30 39.3L32 36.5L34 39.3L36.8 37.4L35.8 40.7L39 42Z"
        fill="#DC143C"
      />
    </svg>
  );
}
