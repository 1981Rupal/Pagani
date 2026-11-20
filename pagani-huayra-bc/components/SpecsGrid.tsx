import Reveal from "./Reveal";
import { carData } from "@/data/carData";

export default function SpecsGrid() {
  return (
    <section id="specs" className="bg-white px-5 py-28 md:px-12 md:py-44">
      <div className="mx-auto max-w-[110rem]">
        <Reveal className="mb-14 flex items-end justify-between gap-6 md:mb-20">
          <h2 className="font-display text-[clamp(2rem,5vw,4.5rem)] font-black leading-none tracking-tight text-ink">
            PERFORMANCE SPECS
          </h2>
          <p className="hidden font-display text-xs font-semibold tracking-[0.3em] text-steel md:block">{carData.model}</p>
        </Reveal>

        <Reveal>
          <dl className="grid grid-cols-1 border-l border-t border-line sm:grid-cols-2 lg:grid-cols-4">
            {carData.specifications.map((s) => (
              <div key={s.label} className="group relative border-b border-r border-line px-6 py-10 transition-colors duration-500 md:px-8 md:py-14">
                <span aria-hidden className="absolute left-0 top-0 h-px w-full origin-left scale-x-0 bg-red transition-transform duration-700 ease-out group-hover:scale-x-100" />
                <dt className="text-sm font-semibold tracking-[0.25em] text-steel">{s.label}</dt>
                <dd className="mt-5 font-display text-[clamp(1.35rem,2.3vw,2.1rem)] font-bold leading-tight text-ink transition-colors duration-500 group-hover:text-red">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
