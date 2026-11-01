# Repository content and asset audit

Source archive: `my_portofolio-master.zip` (the supplied `FRDKUNZ/my_portofolio` repository export).

## Content inventory

| Area | Source | Integrated as |
|---|---|---|
| Name, roles, location, intro, biography, stats, skills, services | `data/content.js` | `src/data/site-content.ts` |
| Project names, descriptions, categories, years, tags, media captions, links | `data/projects.js` | `src/data/portfolio.ts` |
| Contact email and social links | `data/content.js` and `index.html` | `contact` in `src/data/site-content.ts` |
| Contact delivery configuration | `js/main.js` EmailJS setup | `contact.emailJs` and the page contact form |
| Original design system and interaction behavior | `css/styles.css`, `js/main.js` | Content/media were integrated into the existing FERDIANSYAH design and GSAP setup |

The repository lists LinkedIn as `#` and most project URLs as `#`; these dead links were not rendered as links. The actual Workout Web Project and Azure Store demo URLs were retained.

## Project-to-media mapping

| Project | Category | Local repository assets |
|---|---|---|
| Mamaroz Hazelnut Promotion | Design | `mamaroz1.webp`, `mamaroz2.webp`, `mamaroz3.webp` |
| Akuma Apparel Branding | Design | `kaos-1.jpg`, `kaos-2.jpg`, `kaos-3.jpg`, `ads-azure.mp4` |
| BMW M3 Poster Series | Design | `car1.webp`, `car2.webp` |
| Healthy Cream Campaign | Design | `es-cream-1.png`, `es-cream-2.png` |
| Gusion Motion Edit | Video | `gs.png`, `gusion-edt.mp4` |
| Tyler Cinematic Portrait | Video | `tyler.jpg`, `tyler.mp4` |
| Workout Web Project | Programming | `workout_web.png`; live demo retained |
| Azure Store | Programming | `azure_web.png`; live demo retained |

All assets are copied without renaming into `public/portfolio/images` and `public/portfolio/videos`. The source archive's root `pp.jpeg` is available as `public/portfolio/profile.jpeg` and is used in the hero.

## Full media inventory

- Images: `azure_web.png`, `car1.webp`, `car2.webp`, `es-cream-1.png`, `es-cream-2.png`, `gs.png`, `kaos-1.jpg`, `kaos-2.jpg`, `kaos-3.jpg`, `mamaroz1.webp`, `mamaroz2.webp`, `mamaroz3.webp`, `PP.jpeg`, `PP2.png`, `tyler.jpg`, `workout_web.png`, plus root `pp.jpeg` profile photo.
- Videos: `ads-azure.mp4`, `gusion-edt.mp4`, `tyler.mp4`.
- No separate font files were present. Existing local site fonts are retained.
- `.qwen` settings and `.orig` files were audited but not copied into the website.

## Updating content

Edit profile, skills, services, contact, and social links in `src/data/site-content.ts`. Edit projects and their media in `src/data/portfolio.ts`; put replacement files under `public/portfolio/images` or `public/portfolio/videos` and use root-relative paths such as `/portfolio/images/example.webp`. Each media item has a caption, and images may set `fit: "contain"` for artwork that should not be cropped.

Project cards get their collaborative-animation target IDs from their position in the project list. If projects are added or reordered, update the project task groups in `src/lib/collaborative-design.ts` to keep entrance animation targets aligned.
