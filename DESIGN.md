---
name: Newth sites
description: Shared neutral surfaces, Suisse typography and autonomous line artwork.
colors:
  canvas: "#08090b"
  surface: "#0d0e10"
  ink: "#f2f3f5"
  supporting: "#9aa0a8"
  paragraph: "#e8e8ed"
  cyan: "#64d2ff"
  green: "#30d158"
  gold: "#ffd60a"
  coral: "#ff6961"
typography:
  body:
    fontFamily: "Suisse Intl, system-ui, -apple-system, sans-serif"
    fontWeight: 400
  code:
    fontFamily: "Geist Mono, ui-monospace, 'SF Mono', Menlo, Monaco, monospace"
rounded:
  button: "9999px"
---

# Site design

One visual system, with small differences for each site's content. This applies to portfolio, UI docs, Kit, Skills, Garden, r3 and future apps.

## Ownership

Use the supplied Newth four-part mark across site identity, favicons and social
images. The exact SVG geometry is shared in `packages/site-config/brand-marks.js`.
Use black or white on contrasting surfaces and the contained version for app
icons. Originals are also hosted at `https://r2.n3wth.com/mark-contained.svg`,
`mark-black.svg` and `mark-white.svg`. Generate raster sizes from these originals.

- Astryx provides primitive controls and interaction behavior. Link to its [external source](https://github.com/facebook/astryx).
- `packages/ui` owns the Newth theme, fonts, site compositions, component adapters and decorative primitives.
- `packages/site-config` owns shared site identity, metadata and analytics helpers.
- Apps own content, routes, data, router links and specialized product interactions.

Change the lowest appropriate shared layer. Do not copy shared components, CSS or theme tokens into an app to repair a shared problem. Adopt a pattern only where it fits; article outlines, product install commands and immersive artwork have different jobs.

## Page structure

- Use `SiteNavigation`, `PageHeader`, `SiteContainer`, `SiteSection` and `SiteFooter`.
- One persistent top navbar. Do not stack a second sticky mobile heading or section selector beneath it.
- Portfolio uses a flush, solid header below 1024px, with an attached menu and 44px touch targets. Desktop keeps the floating navigation. Other sites opt into the shared compact bar when appropriate.
- Center section hero artwork horizontally and vertically in the available space between the navigation and copy at every width. Size the artwork from that space; keep the page title and description at the lower left.
- The homepage renders its contour landscape as SVG paths in initial HTML. Ordinary navigation stays available without waiting for hydration or artwork animation; no image or model-loading state is involved.
- The homepage scene fills the opening viewport without an introduction or project-action strip. Keep a screen-reader heading and ordinary navigation available.
- For a few section or documentation destinations, use `SiteSectionLinks`: plain wrapping links in page flow, without a selected-section marker. Persistent desktop sidebars may track the current section.
- For a grouped documentation hierarchy on compact screens, put the pages in the top navigation menu and show the documentation context in its brand path. Include every page, mark the current page and close after navigation; do not add a second navigation row.
- Use a clear title and short description in a hero. Omit actions that repeat navigation or merely jump to the content immediately below. Keep useful product actions such as installation or a resume download.
- Do not place small category labels or eyebrow text above titles. Let the title stand on its own.
- Experience dates belong beneath the role within the company group, rather than in a separate grid column.
- Portfolio art photographs fill the available page width; their captions share the page content gutters.
- Documentation articles use `PageHeader spacing="compact"` with parent-owned margins. Keep the title, description and useful start links together; avoid hero-sized gaps and cards for simple navigation.
- Documentation brand paths link each segment to its own home. Keep page-copy and Markdown actions compact below the title. Use one search dialog for content results and explicitly requested, cited AI answers; keep results available when AI fails.
- Starlight docs use the shared Suisse Intl and Geist Mono font assets, an Oliver Newth / Docs brand path, and a compact heading scale. Order navigation by getting started, core concepts, then recipes/reference; contributor setup comes last. Keep detailed recipes collapsed until needed. The overview needs no contents bar; guides show section links below the title on compact screens and an outline on wide screens.
- Portfolio search shows pages, projects, and writing from a prebuilt index immediately, including prefix and typo matches. AI answers start after typing pauses and render below those results, with loading dots while that answer is still arriving. An abstain reply stays off screen while local results are listed. Sources appear as wrapping link chips below the answer, without a separate AI introduction label.
- Keep footer content minimal: identity, Contact, GitHub and necessary legal links. All footer text uses the same muted color.
- The portfolio footer keeps links and a compact email signup on one desktop row, without repeating the identity. On smaller screens, the signup fills the content width above the links. Compact signup uses a standard thin field border and shared control radius, inherited footer typography and an arrow submit button. Align the field edge to the footer links and retain normal input padding. Empty signup status messages take no layout space.
- Keep the footer identity and links on one row when their content fits; wrap naturally on narrow screens instead of stacking at a fixed breakpoint.
- Keep heading order semantic: one primary page heading, section headings below it, then item headings. Visual size does not determine heading level.
- Paragraph copy uses regular weight (400) across all six sites, including article prose and lead paragraphs. Preserve heading, emphasis and control weights.
- Primary paragraph copy uses the existing softer gray ink in dark mode. Supporting/status text retains its semantic color; light-theme ink stays unchanged.
- Reading outline labels, section counts and links use the same supporting type size and regular weight; active links may use medium weight.
- Documentation sidebar groups and page links share one font size; weight and indentation communicate hierarchy.
- Connected-note links use the same supporting size. Avoid decorative side-accent borders on callouts or article graphics.

## Interaction

Active primary navigation uses the shared bright label and a single text-width underline. Keep the indicator neutral and static, without a colored dot or traveling marker.

Thinking uses one reading column with search, compact format and topic filters, and a continuously loaded list of articles and notes. Keep search, filters, sort and loaded batches in the URL so returning from a piece preserves the list. Provide a keyboard-accessible load-more control. Place format and reading time together beneath each description, leaving the right margin clear. Avoid tag clouds, sidebars, featured blocks and repeated counts on this index. Groves keep clear ground around landmarks; show writing details on interaction rather than covering the scene with labels.

Thinking notes keep the reading outline in a collapsed Contents disclosure above the prose, without a sidebar or a repeated Thinking link above the title.

Portfolio main section pages open with full-screen abstract line-art stories. Work gathers independent paths into a system; Art creates monumental light forms; Thinking branches; Projects layers structures; Library layers pages; Contact brings two paths together. Choreography runs autonomously; never respond to cursor, hover or scroll position. Center the large artwork vertically and place quiet 32–48px titles with descriptions at the lower left. Share title scale, gutters and action placement across all six pages. Keep copy readable, with no eyebrow text, invented slogans or repeated navigation. Start currents at path endpoints, choose either direction, and use irregular quiet intervals with at most two sources and two reactions active. Pause motion offscreen for efficiency and show the complete still composition under reduced motion. Keep installation photographs unique in the content below. Article and note reading columns remain centered and use compact headings, with dates beneath the title and description.

Hero light follows each page's structure: Work carries signals through planes, Art illuminates arches and reflections, Thinking spreads through a connected canopy, Projects passes light through offset layers, and Library traces page edges. Each current gets a fresh travel time and quiet interval rather than replaying a synchronized loop. Keep travel steady and ease the fade separately. Crossings pass light to other strands, with fading, bounded chains of reactions. Contact's two forms stay joined without a center marker. Preserve large artwork, shared viewport sizing and copy alignment; frame each motif for equal visual presence. Every base line uses the same 1px non-scaling stroke with opaque ink mixed at 40% against the canvas, so crossings do not compound. Color currents share a 1.5px non-scaling stroke and reach full opacity during their travel.

Thinking is the vertical-alignment exception: its tree grows from the bottom edge of the first viewport. Anchor the roots to the hero floor while other motifs remain centered between navigation and copy.

Extend each motif naturally beyond its frame: Work currents and Art ripples reach the sides, Projects' central thread passes through the top and bottom, Library's bundled page edges continue downward, and Contact's two forms connect outward. Clip extensions at the hero boundary and keep text legible with a flat canvas-colored backing directly behind the copy.

The homepage uses bold 1.25px non-scaling SVG contour lines across the opening viewport, sharing the section artwork's neutral ink and color system. Sweeping ribbons rise through the frame, fold into a loop and open into a broad flowing curve, with changing density and generous ground around the navigation. Smooth SVG joins connect every curve, and tangent extensions keep both ends far outside the viewport throughout the bounded projection. Center the composition on compact screens so the flow crosses the viewport. Existing shared navigation floats above the artwork; the page heading remains available to screen readers. There are no visible introduction, landmark labels or plant-discovery controls.

The homepage is one parametric 3D ribbon: a cubic centerline carries a parallel-transported width frame and local twist. Forty longitudinal strands share that surface. Orthographic projection produces smooth SVG cubics, with depth-sorted opaque surface patches separating front and back at folds. Light travels in ribbon coordinates instead of jumping between unrelated screen-space crossings. Home has a small dedicated clock with visibility and reduced-motion handling; it does not load the section collision/light engine. Project the width frame once per section and generate only the six strands needed by visible echoes. Hidden echoes ship without path data. Preserve the full base composition before hydration and with reduced motion. The homepage imports no WebGL scene or model dependency.

The homepage opens with neutral ink and a dark canvas. Gentle ribbon movement begins immediately; the opening stays free of psychedelic echoes and background color. One animation clock drives SVG-native orthographic depth, time-offset echoes and a bold spectral canvas. Avoid CSS 3D textures and camera singularities so the strokes remain crisp. Colors travel through cyan, violet, coral, gold and green over 96 seconds. One echo follows the recent past and another rehearses a possible future; every 64 seconds they quietly reunite before diverging again. The viewpoint smoothly moves between the close fold and open sweep without a camera cut. A fixed pool of 54 surface patches and two echoes bounds the drawing, with no all-white bursts or difference blending. Keep navigation outside these effects. Pause every effect offscreen or in hidden tabs; reduced motion shows the static vector composition without echoes.

On compact screens, center and crop the fixed-aspect landscape rather than squeezing it. Keep navigation legible at its ordinary size. This replacement is local to Home: existing NightField components and article demonstrations retain their separate implementation and purpose.

On desktop, main section hero descriptions stay on one line. Keep useful actions such as the resume and contact links in the content immediately after the hero, rather than within the opening scene. Descriptions wrap naturally on mobile and tablet.

Use each section's abstract artwork once, in its hero. Content follows directly without repeated illustrations, sticky artwork columns, or empty space reserved for them. Projects retain useful product specimens, and Art photographs extend to the viewport edges with captions aligned to the shared content gutters. Artwork never sits behind readable text or controls. Hero scenes pause offscreen, and reduced motion retains the still composition.

Projects uses one repeated layout: title, purpose, description and actions on the left, with a supporting specimen on the right. Compact screens keep that reading order in a single column. Use the same title scale, spacing and separators for each project; specimens remain content-sized, and diagrams have a bounded width rather than growing to fill a screen.

Article graphics explain the adjacent argument. Keep each figure with a descriptive caption, visible source links and useful alt text. Distinguish original conceptual diagrams from measured charts and reproduced images. Use a single supporting text style for captions, reserve the image dimensions, and let readers open detailed graphics at full size. Record reuse rights for third-party assets; a citation alone is not permission.

Original diagrams stay in SVG format and follow the surrounding page's color scheme. Generate embedded light/dark palettes from the shared theme; an SVG loaded as an image cannot inherit page custom properties. Keep photographs in their original colors.

Use selective Further reading previews after an article: publisher, linked title and a short explanation of its value. Keep them flat and within the reading column, using existing type and spacing. Do not turn every citation into a card or load remote thumbnails without verified reuse rights.

- The portfolio footer permanently includes all six main section links alongside legal and source links in one wrapping row. Do not repeat contextual recommendation rows above it. Keep the footer unruled so the ending reads as one quiet group. Reading pages retain their own related-content navigation. Experience entries use content-driven heights.
- Work summaries and education share the content width instead of mixing narrow summaries with full-width rules. Separate experience entries with space. Compact navigation aligns its identity and menu content to the same responsive gutters.
- Compact navigation is transparent at scroll position zero, solid after scrolling, and solid whenever its menu is open.
- Pages appear immediately. No default entry fades, sliding page transitions, staggered text or reveal observers hiding content.
- Establish canvas, theme and navigation colors before first paint. Server output and client theme state must agree; test both saved preferences and system preference where supported.
- Clicking to a different page starts at the top. Explicit anchor links go to their targets. Preserve browser Back scroll restoration.
- Give controls visible keyboard focus and usable touch targets. Expose selected state for real controls, not decorative navigation that scrolls away.
- Use functional motion sparingly and respect reduced motion. Demonstrations must use the actual documented API.

## Review

Section hero color follows the existing semantic palette with local harmonies: cyan and gold for Work, green and gold for Thinking, cyan and coral for Art and Contact, and gold and coral for Library. Projects retains the full four-color spectrum. Use these same local roles for currents, reflections, echoes and ambient light. Quiet structural edges retain a trace of the scene hue; Work planes and Library pages retain translucent material color between passages. Reduced motion and server-rendered artwork keep structural color and Projects face shading without animation. Reading surfaces, controls and navigation keep their shared neutral theme.

UI documentation groups live semantic swatches by purpose (surfaces, text and borders, status). Typography specimens render shared type roles; compact comparison layouts preserve interactive examples and code. These are documentation layouts, not new application control styles.

Check the rendered result at narrow mobile, intermediate and desktop widths, in every supported theme. Look for overwritten spacing, doubled headers, code overflow, misleading active states and footer inconsistencies. Test a cold load and navigation from a scrolled page. Shared changes require checking relevant consumers, not only the UI showcase.

See [STYLE.md](STYLE.md) for implementation rules and [the architecture guide](docs/workspace/design-system.md) for package entry points and setup.
