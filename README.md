# Ferdiansyah Portfolio

Next.js App Router portfolio rebuilt from the supplied screen recording. Frame notes, section order, measured style estimates, and confidence limits are in [REFERENCE-ANALYSIS.md](./REFERENCE-ANALYSIS.md).

## Install and run

```bash
npm install
npm run dev
```

Open http://localhost:3000. For a production build, run `npm run build`, then `npm start`.

## Replace project artwork

The six SVGs in `public/images/` are bespoke visual stand-ins because the source site assets were not in the workspace. Replace them with Ferdiansyah's original project media and update the `image` paths in `src/data/portfolio.ts`. Landscape images around 1.7:1 fit the reference grid. The source MP4 contains the reference website being shown on a screen; it is not project media for these six portfolio entries.

To add preview video, add an optional video path in `src/data/portfolio.ts` and render a muted, `playsInline` video on hover. No actual Ferdiansyah project video files were provided, so the cards currently use image artwork only.

## Update personal content

Project titles and categories are in `src/data/portfolio.ts`. Skills, services, navigation labels, and page sections are in `src/app/page.tsx`. The original source website could not be reached and no code/media export was present. The exact biography and email are still needed; current copy is limited to the identity, profession, location, skills, services, and project list supplied in the brief. Replace the empty `mailto:` links and form recipient with the actual contact address when provided.

## Tune animation

Change shared filter/easing values in `src/lib/animations.ts`. `src/lib/collaborative-design.ts` contains the cursor, selection, element, and auto-scroll controllers. Each designer gets a separate GSAP timeline; section groups launch independent tasks in parallel. Targets are marked with `data-design-target` in `src/app/page.tsx`. Bounding frames follow live target rectangles during corner scaling and use ResizeObserver to refresh after layout changes. The first-visit sequence yields on wheel, touch, pointer, keyboard, or viewport resize; reduced-motion users see the finished page immediately. GSAP Flip animates project filtering.
