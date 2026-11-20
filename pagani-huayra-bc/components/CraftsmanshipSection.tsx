import Reveal, { Rule } from "./Reveal";
import { carData } from "@/data/carData";

export default function CraftsmanshipSection() {
  const { craftsmanship } = carData;
  return (
    <section className="overflow-hidden bg-white px-5 py-28 md:px-12 md:py-44" aria-labelledby="craft-title">
      <div className="mx-auto grid max-w-[110rem] items-end gap-16 md:grid-cols-12">
        <Reveal className="md:order-2 md:col-span-7 md:col-start-6 md:text-right">
          <h2 id="craft-title" className="font-display text-[clamp(2.3rem,8vw,7.5rem)] font-black leading-[0.92] tracking-tight text-ink">
            THE HUMAN <span className="text-red">HAND.</span>
          </h2>
        </Reveal>

        <Reveal className="md:order-1 md:col-span-6 md:row-span-2 md:row-start-1" delay={0.1}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/huayra-sequence/240.jpg" alt="The Huayra BC V12 engine revealed beneath the open rear deck" loading="lazy" decoding="async" className="edge-fade w-full mix-blend-multiply" />
        </Reveal>

        <dl className="md:order-3 md:col-span-5 md:col-start-8">
          {craftsmanship.facts.map((f, i) => (
            <div key={f.label}>
              <Rule delay={0.05 * i} />
              <Reveal delay={0.08 * i} className="grid grid-cols-[1fr] gap-1 py-6 sm:grid-cols-[1.2fr_1fr] sm:gap-6">
                <dt className="font-display text-sm font-bold tracking-[0.18em] text-ink md:text-base">{f.label}</dt>
                <dd className="text-steel">{f.value}</dd>
              </Reveal>
            </div>
          ))}
          <Rule />
        </dl>
      </div>
    </section>
  );
}
