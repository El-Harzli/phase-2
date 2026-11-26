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
- Env: read `import.meta.env` only in `shared/config/env.js`. Node scripts and the edge functions read `process.env` / `Deno.env` directly. Never put secrets in `VITE_` variables.

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
- Resized-copy widths and names are defined only in `shared/lib/imageVariantConfig.mjs` (plain `.mjs`, no imports, also used by Node scripts). A copy's file name carries its real pixel width: a width above the source's is skipped, never written under a name that overstates it (the `w` numbers in a `srcset` must be true).
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
- Page-specific CSS that cannot be written as utilities lives in `src/index.css`, not in a CSS file imported by a component. The one exception is `src/fonts.css` (the `@font-face` rules), which `index.css` imports itself.
- The compiler-based lint rule also checks manual `useMemo` / `useCallback` dependencies in `site/` code: a dependency must be what the callback actually reads (read `property.agent?.id` into a variable first, then depend on that).
- A full-screen layer that opens on top of another one handles Escape in the capture phase on `document` and stops it there (`Lightbox.jsx`), so one keypress closes only the top layer; ordinary dialogs use `useEscapeKey`.
- A dialog is `role="dialog"` with `aria-modal="true"` and `aria-labelledby` pointing at its visible title (`useId`), as in `PropertyOverlayPage.jsx`.
- A detail component that holds local state about one record (`PropertyDetail`) is rendered with `key={record.id}` instead of resetting that state in effects.
- Escape-to-close uses `shared/hooks/useEscapeKey`, and page scroll locking uses `shared/hooks/useBodyScrollLock`. Public phone links are built only with `site/lib/phoneLinks.js`.
- An automatic load lives in a plain `api/` function that returns `{ data, error }` and never throws. Public data is read through `site/hooks/useCachedRequest.js` on top of `site/lib/requestCache.js` (requests in flight are shared, each resource has a lifetime with a quiet refresh after it, there are no timers, a failed first load is not retried for 10 seconds, and everything is cleared when `SiteApp` unmounts); a page hook wraps one resource (`useBrowseProperties`, `useFeaturedProperties`, `useCatalogs`, `usePropertyCounts`, and so on). Admin contexts still start with `loading: true`, run the first load inside the effect with an `active` flag (state is set only after the await, in a callback), and a manual retry sets `loading` in the click handler.
- Temporary placeholders are marked with a TEMP comment and removed when the real code arrives.
- Manual tests that write to the database use unchanged values, or a throwaway record created and deleted in the same test.
- A clickable property card is an `<article>` with a real `Link` on its title stretched over the card, never `role="button"` with `onClick`. Controls inside it sit above the link with `z-10`.
- A page that says "not found" calls `useNoIndex` (through a small component when it is conditional), but never when the cause is a failed data load.
- A new public resource gets a stable cache key, a lifetime (5 minutes for lists, 30 for catalogs) and an `api/` function that never throws; a loader that returns property cards also calls `rememberPreviews` so the overlay can show them first.
- Lists are light and a full property is only requested by id: Browse uses `buildBrowseProperty`, cards use `buildCardProperty`; never request the description, gallery or agent for a list.
- Filtering, search, sorting and pagination stay in the browser over the light list (the inventory is under 200 properties); do not move them to the database.
- An id that comes from outside (the address bar, a saved favorite) is checked with `isUuid` before it reaches a query.
- Fonts: put the `.woff2` in `src/assets/fonts/` and its `@font-face` in `src/fonts.css`; only the primary font gets a preload in `index.html`, and it must name the same file as the CSS. Long-lived caching (`public/_headers`) is for the hashed `/assets/*` only.
- Code that the browser, Node scripts, the Vite config and edge functions all need goes in `src/shared/lib/` as a plain `.mjs` with no imports (like `imageVariantConfig.mjs` and `heroImage.mjs`). The hero's `srcset` and `sizes` come from `heroImage.mjs` only, and the hero preload is built from the same module, so the two cannot drift apart; changing the hero widths or `HERO_SIZES` means rebuilding and re-checking the preload.
- Something that must differ per route inside the otherwise static `index.html` (the hero preload on `/`) is a marker written at build time by a plugin in `vite.config.js` and swapped by an edge function scoped to that path. Such an edge function returns the original response on any failure (`onError: "bypass"`), touches only 200 `text/html` GET responses that contain the marker, and sets its cache headers explicitly (`Netlify-CDN-Cache-Control` for the CDN; browsers keep re-checking).
- Measure performance with `npm run build` and `npm run preview` in an Incognito window, never with the dev server.
- Browse pagination: the current page lives in the address as `?page=N` (left out on page 1), read and written only through `useBrowseFilters` (`page`, `setPage`), next to `?q` and `?neighborhood`. A click on the page controls adds a history entry; changing a filter, the search or the sort goes back to page 1 with `replace`, and the internal syncing in that hook never resets the page. `PropertyList` clamps the page to the last real one, slices the sorted list for grid and list, and gives the map the whole list (no page controls in map view). The page size comes from `usePageSize` (8 below Tailwind's `sm`, 12 from `sm` up; the two numbers are in `site/lib/pagination.js`) and has to change together with the grid's `sm:grid-cols-2`. Only a click on the controls scrolls, to the top of the results card.
- A page's title and meta description are written only in `shared/seo/pageMeta.js` (`PAGE_META`; each page's own address is in `PAGE_PATHS`). The pages read them and the edge functions import the same file, so the words a crawler finds in the raw HTML and the words in the browser tab cannot differ. The tab title is built with `formatPageTitle` (used by `usePageTitle` and by the edge functions). A page component never types its own title or description.
- Edge functions that write a page's own words into the raw HTML (`static-page-meta.js`, `property-og-tags.js`, `browse-cards.js`, `home-cards.js`) follow one pattern: each lists the plain and the trailing-slash form of its paths; touches only 200 `text/html` responses (GET only, except `property-og-tags.js`); returns the original response on any failure (a `try/catch`, a clone made before the body is read, and `onError: "bypass"`); gives every visitor the same HTML (no user-agent checks); leaves exactly one of each tag it writes (it replaces the first, removes extra copies, and adds the tag only when there is none); builds the canonical link and `og:url` from `VITE_SITE_URL` plus the page's own path (plus `?page=N` from page 2 on Browse), never from the request's host, query string or trailing slash; puts plain content only inside `<div id="root">`, where React replaces it when it starts (so a server-written JSON-LD goes there too, never in `<head>`); asks Supabase with the anon key through its REST address, with a 4-second limit, and leaves the page untouched when that fails. Only a clear "no such property" answer, or an id that is not a UUID, gives a 404 (`property-og-tags.js`). Text or rules copied from React are marked with a comment that names the React file.
- A file that an edge function imports from `src/` must be plain: no `@/` aliases, no `import.meta`, no React or JSX (today `shared/seo/pageMeta.js`, `shared/lib/propertyUrl.js`, `site/lib/pagination.js` and `site/lib/formatPrice.js`). After editing one of them, `git grep -nE "^\s*import "` and `git grep -nE "import\.meta"` on those four files must both print nothing. The edge functions that read Supabase or the site address need `VITE_SITE_URL`, `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set in Netlify with the "Edge functions" scope (`hero-preload.js` needs none); until `VITE_SITE_URL` is set, the placeholder domain written in each function and in `index.html` is used. Cache times: property pages none, Browse 5 minutes, Home, the four static pages and the sitemap one hour. A function that caches sets `cache: "manual"` and its own headers; `home-cards.js` copies the headers of `hero-preload.js` because both run on `/`.