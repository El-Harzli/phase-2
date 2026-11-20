export default function SectionCard({ title, description, children }) {
  return (
    <div className="rounded-[24px] border border-accent-500/10 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
      <div className="border-b border-accent-500/10 px-5 py-4 sm:px-6">
        <h3 className="text-base font-semibold text-main">{title}</h3>
        <p className="mt-1 text-sm text-trenary">{description}</p>
      </div>
      {children}
    </div>
  );
}
