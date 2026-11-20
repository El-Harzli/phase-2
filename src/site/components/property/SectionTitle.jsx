// "Listed by", "Location"… — a heading with a hairline running out to the
// right edge. The element is passed in (h2 on the standalone page, h3 in the
// overlay) so the page's heading levels stay correct either way.
function SectionTitle({ as: Tag, children }) {
  return (
    <Tag className="mb-3 flex items-center gap-4 text-base font-semibold text-main">
      <span className="shrink-0">{children}</span>
      <span className="h-px flex-1 bg-accent-500/10" aria-hidden="true" />
    </Tag>
  );
}

export default SectionTitle;
