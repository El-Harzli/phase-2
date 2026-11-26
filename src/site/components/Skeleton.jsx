// One pulsing placeholder block — the building piece of every public loading
// skeleton. `className` gives it its size and shape (h-4 w-24 rounded-md …); the
// colour and the pulse are fixed here so every skeleton on the site looks the
// same. `motion-safe:` means visitors who ask their device to reduce motion see
// a still block instead of a pulsing one. It is hidden from screen readers on
// purpose: the skeleton's wrapper carries one "Loading …" message
// (role="status"), which reads better than a list of empty boxes.
function Skeleton({ className = "" }) {
  return <div aria-hidden="true" className={`bg-primary-600 motion-safe:animate-pulse ${className}`} />;
}

export default Skeleton;