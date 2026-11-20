// The accent-colored loading ring used across the site. `className` sets its
// size and colors; the default is the standard 32px accent ring.
export default function Spinner({ className = "h-8 w-8 border-accent-500/20 border-t-accent-500" }) {
  return <div className={`animate-spin rounded-full border-2 ${className}`} />;
}
