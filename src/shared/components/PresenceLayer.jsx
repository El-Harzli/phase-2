import { useIsPresent } from "framer-motion";

// While a modal or dialog fades out after closing, framer-motion keeps its
// content mounted, and it would still respond to clicks and keys — e.g. a
// "Save" button that re-enables the moment a save finishes could be pressed a
// second time. `inert` makes the whole exiting layer ignore the mouse, touch
// and keyboard until it's gone.
export default function PresenceLayer({ children }) {
  const isPresent = useIsPresent();
  return (
    <div inert={!isPresent} className="fixed inset-0 z-50">
      {children}
    </div>
  );
}
