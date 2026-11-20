import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { heroPreloadTag, toVariants } from "./src/shared/lib/heroImage.mjs";

// React Compiler only applies to the admin dashboard (src/Dashboard) —
// that's the codebase it was actually written against (see its standing
// rule about optional-chaining nullable values, since the compiler
// evaluates property accesses unconditionally before runtime guards run).
// The public site predates that rule, so auto-memoizing it too could
// surface latent issues it was never checked against.
const reactCompiler = reactCompilerPreset({ target: "19" });
reactCompiler.rolldown.filter.id = { include: [/[\\/]src[\\/]admin[\\/]/] };

// Build only. Leaves the homepage hero's early preload in dist/index.html as an
// HTML comment (<!--hero-preload <link ...>-->). A comment does nothing in the
// browser, so every route stays exactly as it was; the Netlify edge function for
// "/" swaps it for the real tag, which is how the preload reaches the homepage
// and no other page. The tag is built from the hashed AVIF files this build
// actually emitted, so nothing is hardcoded and it can't point at a file that
// doesn't exist. If no hero AVIF is found, or index.html has no </head>, nothing
// is added and the build says so.
function heroPreloadMarker() {
  let base = "/";
  return {
    name: "hero-preload-marker",
    apply: "build",
    configResolved(config) {
      base = config.base;
    },
    transformIndexHtml: {
      order: "post",
      handler(html, { bundle }) {
        // The file name has to match the one the import.meta.glob calls in HeroSection.jsx look for.
        const files = {};
        for (const fileName of Object.keys(bundle ?? {})) {
          if (/(^|\/)hero_transparent-[^/]*\.avif$/.test(fileName)) files[fileName] = `${base}${fileName}`;
        }
        const tag = heroPreloadTag(toVariants(files));
        if (!tag || !html.includes("</head>")) {
          console.warn("[hero-preload] no hero AVIF files, or no </head> in index.html: preload marker not added");
          return html;
        }
        return html.replace("</head>", () => `<!--hero-preload ${tag}-->\n  </head>`);
      },
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompiler] }), tailwindcss(), heroPreloadMarker()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
