import Reveal, { Rule } from "./Reveal";
import { carData } from "@/data/carData";

export default function StorySection() {
  const { story } = carData;
  return (
    <section id="story" className="relative overflow-hidden bg-white px-5 py-28 md:px-12 md:py-48">
      <span aria-hidden className="stroke-line pointer-events-none absolute -right-4 top-10 select-none font-display text-[clamp(8rem,28vw,26rem)] font-black leading-none md:top-16">
        {carData.year}
      </span>

      <div className="relative mx-auto grid max-w-[110rem] gap-16 md:grid-cols-12">
        <div className="md:col-span-8">
          <Reveal>
            <h2 className="font-display text-[clamp(2.4rem,9.5vw,9rem)] font-black leading-[0.9] tracking-tight text-ink">
              {story.title[0]}
              <span className="block pl-[8vw] text-red md:pl-[12vw]">{story.title[1]}</span>
            </h2>
          </Reveal>
          <Reveal delay={0.15} className="mt-14 max-w-md md:ml-[12vw]">
            <p className="text-xl leading-snug text-steel md:text-2xl">{story.text}</p>
          </Reveal>
        </div>

        <aside className="md:col-span-3 md:col-start-10 md:self-end">
          <dl>
            {story.facts.map((f, i) => (
              <Reveal key={f.label} delay={0.1 * i}>
                <Rule className="mb-4" />
                <div className="pb-5">
                  <dt className="text-sm font-semibold tracking-[0.25em] text-steel">{f.label}</dt>
                  <dd className="mt-1 font-display text-lg font-bold tracking-wide text-ink md:text-xl">{f.value}</dd>
                </div>
              </Reveal>
            ))}
          </dl>
        </aside>
      </div>

      <Reveal className="relative mx-auto mt-24 max-w-[110rem] md:mt-40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/huayra-sequence/40.jpg" alt="Pagani Huayra BC, three-quarter view" loading="lazy" decoding="async" className="edge-fade mx-auto w-full max-w-5xl mix-blend-multiply" />
      </Reveal>
    </section>
  );
}
