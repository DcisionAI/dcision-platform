export function Logo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="48" height="48" rx="8" fill="#2563EB" />
      <path
        d="M14 24C14 18.4772 18.4772 14 24 14C29.5228 14 34 18.4772 34 24C34 29.5228 29.5228 34 24 34"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M24 34C21.2386 34 19 31.7614 19 29C19 26.2386 21.2386 24 24 24C26.7614 24 29 26.2386 29 29C29 31.7614 26.7614 34 24 34Z"
        fill="white"
      />
    </svg>
  );
} 