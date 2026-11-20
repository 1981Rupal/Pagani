import Reveal from "./Reveal";
import { carData } from "@/data/carData";

export default function FinalCTA() {
  const { cta } = carData;
  return (
    <section id="inquire" className="relative overflow-hidden bg-white px-5 pb-32 pt-28 md:px-12 md:pb-48 md:pt-44">
      <div className="mx-auto max-w-[110rem]">
        <Reveal>
          <h2 className="font-display text-[clamp(2.4rem,10vw,9.5rem)] font-black leading-[0.9] tracking-tight text-ink">
            {cta.title[0]}
            <span className="block md:pl-[14vw]">{cta.title[1]}</span>
          </h2>
        </Reveal>

        <Reveal delay={0.1} className="relative my-14 md:my-24">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/huayra-sequence/1.jpg" alt="Pagani Huayra BC, front view" loading="lazy" decoding="async" className="edge-fade mx-auto w-full max-w-4xl mix-blend-multiply" />
          <p className="mt-6 text-center font-display text-sm font-bold tracking-[0.5em] text-red md:text-base">{cta.model}</p>
        </Reveal>

        <Reveal delay={0.15} className="flex flex-col items-stretch gap-4 sm:flex-row sm:justify-center">
          <a href={cta.primary.href} className="bg-red px-8 py-5 text-center font-display text-xs font-bold tracking-[0.22em] text-white transition-colors duration-300 hover:bg-red-hot md:text-sm">
            {cta.primary.label}
          </a>
          <a href={cta.secondary.href} target="_blank" rel="noopener noreferrer" className="border border-ink px-8 py-5 text-center font-display text-xs font-bold tracking-[0.22em] text-ink transition-colors duration-300 hover:border-red hover:text-red md:text-sm">
            {cta.secondary.label}
          </a>
        </Reveal>
      </div>
    </section>
  );
}
