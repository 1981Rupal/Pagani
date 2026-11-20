# Pagani Huayra BC Macchina Volante

Next.js 14 (App Router) · TypeScript · Tailwind CSS v4 · Framer Motion · Lenis · Canvas

    npm install
    npm run dev        # http://localhost:3000
    npm run build

- Frames: `public/images/huayra-sequence/1.jpg … 240.jpg` (1600px wide, extracted from the supplied video)
- All copy and numbers live in `data/carData.ts`; hero phase timing is the `range` of each phase.
- Fonts (Orbitron, Rajdhani) are self-hosted via @fontsource, so no network is needed at build time.
