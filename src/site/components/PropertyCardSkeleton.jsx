import Skeleton from "@/site/components/Skeleton";

// The loading shape of PropertyCard's "grid" layout. The outer box uses the same
// classes as the real card, and the blocks are sized to the real card's lines
// (image h-44; price text-lg = 28px; title text-sm = 20px; location text-xs =
// 16px; stat chips 24px), so a card swaps in for its skeleton without the page
// below it moving. If PropertyCard's grid layout changes height, change it here
// too.
function PropertyCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="relative flex flex-col rounded-[24px] border border-accent-500/10 bg-white overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
    >
      <Skeleton className="h-44 shrink-0" />
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-7 w-28 rounded-md" />
        <Skeleton className="h-5 w-4/5 rounded-md" />
        <Skeleton className="h-4 w-3/5 rounded-md" />
        <div className="flex items-center gap-1.5 mt-1">
          <Skeleton className="h-6 w-16 rounded-md" />
          <Skeleton className="h-6 w-16 rounded-md" />
          <Skeleton className="h-6 w-16 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export default PropertyCardSkeleton;