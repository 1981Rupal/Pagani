import Reveal, { Rule } from "./Reveal";
import { carData } from "@/data/carData";

export default function DesignSection() {
  const { design } = carData;
  return (
    <section id="design" className="bg-white px-5 py-28 md:px-12 md:py-44">
      <div className="mx-auto grid max-w-[110rem] gap-16 md:grid-cols-12">
        <div className="md:col-span-6 md:sticky md:top-32 md:self-start">
          <Reveal>
            <p className="font-display text-xs font-semibold tracking-[0.35em] text-red md:text-sm">{design.kicker}</p>
            <h2 className="mt-8 font-display text-[clamp(2rem,5.6vw,5.5rem)] font-black leading-[0.95] tracking-tight text-ink">
              {design.title}
            </h2>
          </Reveal>
        </div>

        <ul className="md:col-span-5 md:col-start-8 md:pt-24">
          {design.items.map((item, i) => (
            <li key={item.title} className="group">
              <Rule delay={0.05 * i} />
              <Reveal delay={0.08 * i} className="flex gap-5 py-8">
                <span aria-hidden className="mt-2 block h-2.5 w-2.5 shrink-0 bg-line transition-colors duration-500 group-hover:bg-red" />
                <div>
                  <h3 className="font-display text-lg font-bold tracking-[0.12em] text-ink md:text-xl">{item.title}</h3>
                  <p className="mt-2 max-w-sm text-steel">{item.text}</p>
                </div>
              </Reveal>
            </li>
          ))}
          <li><Rule /></li>
        </ul>
      </div>
    </section>
  );
}
