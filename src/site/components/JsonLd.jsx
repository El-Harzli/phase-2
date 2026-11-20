// Structured data for search engines, rendered as a JSON-LD script tag. `<` is
// escaped so a value containing "</script>" can never end the tag early.
export default function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
