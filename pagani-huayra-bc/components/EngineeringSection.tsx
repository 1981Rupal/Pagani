import Reveal, { Rule } from "./Reveal";
import { carData } from "@/data/carData";

export default function EngineeringSection() {
  const { engineering } = carData;
  return (
    <section id="engineering" className="relative overflow-hidden bg-white px-5 py-28 md:px-12 md:py-44">
      <div className="mx-auto max-w-[110rem]">
        <Reveal>
          <h2 className="max-w-4xl font-display text-[clamp(1.9rem,5.4vw,5rem)] font-black leading-[0.98] tracking-tight text-ink">
            {engineering.title}
          </h2>
        </Reveal>

        <Reveal delay={0.1} className="mt-16 md:mt-24">
          <p aria-label={engineering.engine} className="stroke-ink select-none font-display text-[clamp(2.75rem,12.5vw,12rem)] font-black leading-none tracking-tight">
            {engineering.engine}
          </p>
        </Reveal>

        <div className="relative mt-4 md:mt-8">
          <Rule />
          {/* dimension ticks */}
          <div aria-hidden className="flex justify-between">
            {Array.from({ length: 25 }).map((_, i) => (
              <span key={i} className={`block w-px bg-line ${i % 6 === 0 ? "h-4 bg-red/70" : "h-2"}`} />
            ))}
          </div>
        </div>

        <dl className="mt-16 grid gap-14 md:mt-24 md:grid-cols-3 md:gap-8">
          {engineering.figures.map((f, i) => (
            <Reveal key={f.unit} delay={0.12 * i} className={i === 1 ? "md:mt-20" : i === 2 ? "md:mt-40" : ""}>
              <div className="border-l border-red pl-6">
                <dd className="font-display text-[clamp(3.5rem,10vw,9rem)] font-black leading-[0.9] text-ink">{f.value}</dd>
                <dt className="mt-3 font-display text-sm font-semibold tracking-[0.35em] text-red md:text-base">{f.unit}</dt>
              </div>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
