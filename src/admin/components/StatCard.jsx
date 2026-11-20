import { IoCheckmarkCircleOutline } from "react-icons/io5";

export default function StatCard({ icon: Icon, label, value, detail, done = false, progress }) {
  return (
    <div className="relative rounded-[14px] border border-accent-500/10 bg-white p-4 shadow-[0_7px_24px_rgba(53,35,42,0.035)] transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] sm:p-5">
      {done && (
        <IoCheckmarkCircleOutline
          size={17}
          className="absolute right-4 top-4 text-accent-500 sm:right-5 sm:top-5"
          aria-hidden="true"
        />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-accent-500/10 text-accent-500 sm:h-10 sm:w-10">
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-trenary">{label}</p>
          <p className="mt-0.5 text-2xl font-semibold leading-tight tracking-tight text-main sm:text-[27px]">{value}</p>
        </div>
      </div>

      {detail && <p className="mt-3 hidden text-[11px] text-trenary/80 sm:block">{detail}</p>}

      {progress !== undefined && (
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-primary-600">
          <div className="h-full rounded-full bg-accent-500" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}
