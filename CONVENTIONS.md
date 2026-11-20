# Conventions

## Folders

- `src/shared/` — used by both surfaces: Supabase client, API functions, pure helpers, hooks, config, SEO, UI used by both.
- `src/site/` — public website only: `pages/` (one file per route), `components/`, `context/`, `api/`, `hooks/`, and `lib/` for pure helpers and fallback data. A component used by only one page lives in a lowercase folder named after that page (`site/components/home/`); components used by several pages stay directly in `site/components/`.
- `src/admin/` — dashboard only, same layout plus `layouts/` (layout routes like `AdminLayout`), `config/`, `hooks/` and `lib/`. This is the only lazy-loaded chunk.
- `site/` and `admin/` never import from each other. `shared/` never imports from either.

## Naming

- Component files (pages and components): PascalCase.jsx. Hooks: useThing.js. Other files: camelCase.js. Folders: lowercase.
- Folders holding many files of one kind are plural (`components`, `hooks`, `layouts`, `pages`). Exception, by decision: `context/` stays singular.
- Suffixes: route-level components end in `Page` (`LoginPage`); the big blocks of a page end in `Section` (`HeroSection`); layouts in `Layout` (`AdminLayout`); context providers in `Provider` with a `useThing` hook (`AuthProvider` / `useAuth`); error fallbacks in `Fallback` (`AdminErrorFallback`, `SiteErrorFallback`).
- Variables and functions: camelCase. Module-level constants: UPPER_SNAKE_CASE (`NAV_ITEMS`, `FIELD_ORDER`).
- Exports: `export default` for components and hooks (one per file). Named exports for everything else (api functions, lib helpers, config, providers with their hook).
- An `api/` module with many functions is imported as a namespace (`import * as catalogApi from "@/admin/api/catalog"`), so its names never clash with the context's own; where a module is imported by name instead (properties), its functions get distinct names (`insertProperty`, `patchProperty`, `replacePropertyImages`).
- Pure helpers that belong to one page or form live in `admin/lib/` named after it (`propertyList.js`, `propertyForm.js`, `settingsForm.js`, `overviewStats.js`).
- Names say what the thing does (`runQueriesWithRetry`, not `fetchAllWithRetry`). Check a name against this list before creating a file or function.
- Exception: SEO hooks (`useNoIndex`, `usePageTitle`) live in `shared/seo/`, not `shared/hooks/`, so all SEO code is in one place.
- `SiteSettings*` refers to the `site_settings` database table, not the public `site/` folder.

## Imports

- Alias `@/` = `src/`. Use it across folders; use relative paths inside the same folder.
- Env: read `import.meta.env` only in `shared/config/env.js`. Node scripts and the edge function read `process.env` / `Deno.env` directly. Never put secrets in `VITE_` variables.

## Style

- Prettier (printWidth 120, LF line endings). Run `npm run format` before finishing a step.
- Install rule: browser-imported packages go in `dependencies`, build and check tools in `devDependencies`.
- A targeted `eslint-disable` line must have a comment above it saying why the rule is wrong for that line.
- Text sizes follow the admin scale: 14px labels and body, 16px inputs (also the iOS no-zoom rule), 12px helper text, 16px card titles. Don't introduce smaller sizes for readable text.
- One visible page `h1` (the top bar's). Page titles inside a page are `h2`, card titles `h3`.

## Forms and section pages (admin)

- All errors are red. Use `FormField` (with `multiline` for a textarea) for label + control + error + hint, `SelectField` for dropdowns, and `SectionCard` for card wrappers. A `required` prop adds a red `*` to the label.
- The property edit page uses the "editor" look through `variant="editor"` on `FormField`, `Select`, `SelectField` and `SegmentedControl`, plus `compact` on `Toggle`, `FormSection` for its cards and `layout="checklist"` on `AmenityMultiSelect`. The shared class strings are in `admin/config/editorFieldStyles.js`. Other forms keep the default look.
- A card whose content can be wider than the screen (the photo strip) needs `grid-cols-[minmax(0,1fr)]` on its grid and `min-w-0` on the child, otherwise the card widens instead of the content scrolling.
- Modal forms use `ModalForm` (form shell, Cancel/Save footer, "Saving…" double-submit guard). Form components await `onSubmit` and track `isSubmitting`. A full-page form disables its Save button while saving and doesn't re-enable it after a success.
- Every async button needs a guard against repeat clicks: `ModalForm` and `ConfirmDialog` have one built in; for other buttons (inline add/rename, Add/Remove) keep an `isSaving` flag and ignore the click while it's set.
- `Modal`, `ConfirmDialog` and the public `FiltersPanel` render through the shared `PresenceLayer` (`shared/components/`), which makes the exiting layer `inert` during the fade-out, so nothing inside can be clicked after a successful save.
- List pages use `PageHeader`, `IconButton` and `EmptyState`. Failed saves go through `handleSaveError` (not found: toast and close; conflict: toast and stay open, or close with `closeOnConflict` for tiny inline edits; otherwise the section's generic message).
- Lists with filters or sorting keep that state in the URL (`useSearchParams`, `replace: true`) so going back restores it.
- A panel that loads its own data (`ContactInsights`) owns its loading, error and retry states, so a failure there can't break the page around it. Loading is set in the click handlers, not in an effect, and a handler ignores a choice that is already selected.
- Validation is a pure function in `admin/lib/` returning an errors object; building the save payload is another pure function there.
- Numbers: a browser number box reports unreadable text (a pasted `5e`) as an empty value, so in an optional field a typo would be saved as 0. Required number fields may use `type="number"` (an unreadable value counts as empty and shows an error); optional ones must be text boxes (`type="text"`, `inputMode="numeric"`). Either way, check the value with a strict pattern and block the unwanted keys while typing (`numberInputKeys.js`). Forms with their own red messages use `noValidate`.
- On a failed submit of a long form, call `focusFirstInvalidField(FIELD_ORDER, errors)` with an explicit list of `{ key, id }` in on-screen order.
- Saves use the `updated_at` check (`updateWithConcurrencyCheck`; Settings has its own version) so a stale form can't overwrite someone else's save. A save sends the whole form, not only the changed fields.
- State that mirrors a prop is synced during render with a "previous value" check, not in an effect. For a derived list, compare the list of ids (a joined string), not the array. The same pattern keeps page state in step with the URL or a route parameter (`site/hooks/useBrowseFilters.js`).
- Anything heavy that most visitors never need (the map) is loaded with `lazy` from the component that opens it. Number-like boxes whose value is clamped are text boxes with `inputMode="numeric"` that keep a draft and apply it on blur or Enter (`PriceRangeSlider.jsx`).
- Reorderable lists: save once on drop; skip the save when the order didn't change; put the list back if the save fails.
- Fields inside a form: a key handler that runs an action on Enter must call `event.preventDefault()`, or Enter also submits the surrounding form.

## Images

- Uploads go only through `syncImages` (upload new files, then the database write, then delete the replaced files). Storage calls live in `admin/api/imageStorage.js`.
- Resized-copy widths and names are defined only in `shared/lib/imageVariantConfig.mjs` (plain `.mjs`, no imports, also used by Node scripts).
- Photo fields are `AvatarUpload` (circle), `PhotoUpload` (landscape, optional focal point) or `ImageGallery` (many photos, reorderable, with a "Make cover" button). All revoke blob preview URLs on unmount through `useLocalImageCleanup(urls, preserveOnUnmountRef)`, unless the form just saved.

## Next.js-friendly rules

- Supabase queries live in plain functions in `api/` files, never inside components.
- No `window`, `document` or `localStorage` at module top level.
- One route-level component per route, kept separate from reusable components.
- Routes and URLs stay identical to the old site.
- SEO tags are built in one central place (`shared/seo/`).
- Leaflet touches `window` as soon as it's imported, so map components must load client-only.

## Working rules

- Keep every old comment verbatim when porting; list stale ones in `PROGRESS.md`.
- No duplicated helpers: check the old copies behave the same before merging.
- React Compiler is for `src/admin/` only (filter in `vite.config.js`). Rule: use optional chaining on nullable values. Admin data contexts do not use manual `useMemo` / `useCallback` lists; the compiler handles it. Public (`site/`) contexts are not compiled, so they keep manual `useMemo` / `useCallback`.
- No new dependencies without asking. Tools that are run by hand (`sharp` for the image scripts) are not added to `package.json`; the script's header says how to install them.
- Node scripts live in `scripts/` (ESLint treats them as Node code) and the Netlify edge functions in `netlify/edge-functions/` (Deno). Secrets stay out of the repository: the Supabase service-role key is only ever typed on your own machine for `backfill-image-variants.mjs`, never in a `VITE_` variable.
- `/sitemap.xml` is served live by `netlify/edge-functions/sitemap.js`. `public/robots.txt` is a normal tracked file. When a route is added to `SiteApp.jsx`, add it to `STATIC_ROUTES` in the sitemap function too.
- Structured data goes through `site/components/JsonLd.jsx`, with the real site address (`window.location.origin`) and the agency name from Settings, never hard-coded values. A page component never renders its own `<main>` (`SiteApp` provides it).
- Page-specific CSS that cannot be written as utilities lives in `src/index.css`, not in a CSS file imported by a component.
- A clickable property card is an `<article>` with a real `Link` on its title stretched over the card, never `role="button"` with `onClick`. Controls inside it sit above the link with `z-10`.
- A page that says "not found" calls `useNoIndex` (through a small component when it is conditional), but never when the cause is a failed data load.
- The compiler-based lint rule also checks manual `useMemo` / `useCallback` dependencies in `site/` code: a dependency must be what the callback actually reads (read `property.agent?.id` into a variable first, then depend on that).
- A full-screen layer that opens on top of another one handles Escape in the capture phase on `document` and stops it there (`Lightbox.jsx`), so one keypress closes only the top layer; ordinary dialogs use `useEscapeKey`.
- A dialog is `role="dialog"` with `aria-modal="true"` and `aria-labelledby` pointing at its visible title (`useId`), as in `PropertyOverlayPage.jsx`.
- A detail component that holds local state about one record (`PropertyDetail`) is rendered with `key={record.id}` instead of resetting that state in effects.
- Escape-to-close uses `shared/hooks/useEscapeKey`, and page scroll locking uses `shared/hooks/useBodyScrollLock`. Public phone links are built only with `site/lib/phoneLinks.js`.
- An automatic load lives in a plain `api/` function that returns `{ data, error }` and never throws. The context starts with `loading: true`, runs the first load inside its effect with an `active` flag (state is set only after the await, in a callback), and a manual retry sets `loading` in the click handler.
- Temporary placeholders are marked with a TEMP comment and removed when the real code arrives.
- Manual tests that write to the database use unchanged values, or a throwaway record created and deleted in the same test.
