export function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="8" height="8" rx="2" fill="var(--accent)" />
      <rect
        x="12"
        y="2"
        width="8"
        height="8"
        rx="2"
        fill="var(--accent)"
        opacity="0.4"
      />
      <rect
        x="2"
        y="12"
        width="8"
        height="8"
        rx="2"
        fill="var(--accent)"
        opacity="0.4"
      />
      <rect
        x="12"
        y="12"
        width="8"
        height="8"
        rx="2"
        fill="var(--accent)"
        opacity="0.6"
      />
    </svg>
  );
}
