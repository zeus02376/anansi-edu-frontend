// Marque ANANSI : un cube vu en perspective, trois faces de blanc.
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`flex items-center gap-2.5 font-display font-bold tracking-wide ${className}`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6 shrink-0">
        <path d="M12 2 21 7 12 12 3 7z" fill="#fff" />
        <path d="M3 7 12 12 12 22 3 17z" fill="#fff" fillOpacity="0.65" />
        <path d="M21 7 12 12 12 22 21 17z" fill="#fff" fillOpacity="0.35" />
      </svg>
      ANANSI
    </span>
  );
}
