# OmniAlign Atlas

OmniAlign Atlas is a dual-mode FASTA alignment studio for both protein and nucleotide workflows. It pairs rapid sequence comparison with mutation analytics, nucleotide insights, BLAST launchers, and PyMOL command generation. The project ships as a static Vite build that is ready for GitHub Pages.

## Highlights

- Protein and nucleotide modes with mode-aware parsing, validation, and UI
- Pairwise or multi-sequence alignment with interactive heatmap styling
- Protein mode: physicochemical summaries, stability flags, secondary structure estimates, and PyMOL macros
- Nucleotide mode: GC balance, base composition, transition/transversion counts, and one-click BLAST links
- Zoomable, scrollable alignment matrix with consensus/reference overlays
- Curated sidebar linking to structure prediction and BLAST tooling

## Getting Started

```sh
git clone https://github.com/Zubair2021/OmniAlign.git
cd OmniAlign
npm install
npm run dev
```

The development server runs on http://localhost:8080. Vite hot-module reload keeps the UI synced with your edits.

## Mode Quick Start

- Use the mode switch at the top of the editor card to select **Protein** or **Nucleotide** mode.
- Paste or load FASTA files for the reference and variants. Multi-sequence alignment allows you to skip the reference.
- Protein mode unlocks physicochemical tables and PyMOL scripting; nucleotide mode exposes GC and transition/transversion analytics plus BLAST shortcuts.

## Deploying to GitHub Pages

The app is configured for static hosting via GitHub Pages:

1. Build the optimized bundle:
   ```sh
   npm run build
   ```
2. A `dist` directory will be created containing the static assets (the build uses a relative base path and HashRouter so it works under any repository path).
3. Commit the `dist` output or use `git subtree` to publish it to a `gh-pages` branch:
   ```sh
   git add dist
   git commit -m "Build GitHub Pages bundle"
   git subtree push --prefix dist origin gh-pages
   ```
4. In your GitHub repository, enable Pages and point it at the `gh-pages` branch.

If you prefer the `gh-pages` npm package, run `npx gh-pages -d dist` after `npm run build`.

## Creating and Pushing a Fresh Repository

If you are starting from this local folder:

1. Initialize a new repository and commit the code:
   ```sh
   git init
   git add .
   git commit -m "Initial OmniAlign Atlas import"
   ```
2. Create an empty repository on GitHub (no README, no .gitignore).
3. Link your local repository to GitHub and push:
   ```sh
   git remote add origin https://github.com/Zubair2021/OmniAlign.git
   git branch -M main
   git push -u origin main
   ```
4. (Optional) Publish GitHub Pages with the `gh-pages` branch following the steps above.

## Tech Stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui component primitives
- React Router (HashRouter for Pages compatibility)
- @tanstack/react-query and sonner for UX polish

Happy aligning!
