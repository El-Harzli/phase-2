import { IoAddOutline } from "react-icons/io5";

export default function PageHeader({ title, description, actionLabel, onAction }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold text-main md:text-2xl">{title}</h2>
        <p className="mt-1 text-sm text-trenary">{description}</p>
      </div>
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="flex h-11 shrink-0 items-center gap-2 rounded-[12px] bg-accent-500 px-4 text-sm font-medium text-white hover:bg-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
        >
          <IoAddOutline size={18} />
          <span className="hidden sm:inline">{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
