export function Brand({ compact = false }) {
  return (
    <span className="brand" aria-label="Estudo Lendário">
      <span className="brand__mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none">
          <path d="M8 8.5 16 5l8 3.5v9L16 27l-8-9.5v-9Z" stroke="currentColor" strokeWidth="2" />
          <path d="m11.5 14 3 3 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {!compact && <span>Estudo <strong>Lendário</strong></span>}
    </span>
  );
}
