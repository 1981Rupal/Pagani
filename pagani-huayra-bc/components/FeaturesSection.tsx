import Reveal, { Rule } from "./Reveal";
import { carData } from "@/data/carData";
import { cn } from "@/lib/utils";

/** Four deliberately different compositions rather than one repeated card. */
const layouts = [
  { wrap: "md:grid-cols-12", title: "md:col-span-9 text-[clamp(2.2rem,7vw,6.5rem)]", text: "md:col-span-3 md:col-start-10 md:self-end" },
  { wrap: "md:grid-cols-12 md:text-right", title: "md:col-span-7 md:col-start-6 md:order-2 text-[clamp(1.8rem,4.6vw,4.25rem)]", text: "md:col-span-4 md:order-1 md:self-end md:text-left" },
  { wrap: "md:grid-cols-12", title: "md:col-span-5 text-[clamp(1.8rem,3.8vw,3.5rem)]", text: "md:col-span-4 md:col-start-8 md:self-center" },
  { wrap: "md:grid-cols-12", title: "md:col-span-10 md:col-start-3 text-[clamp(2.2rem,7vw,6.5rem)] text-red", text: "md:col-span-4 md:col-start-3 md:row-start-2" },
] as const;

export default function FeaturesSection() {
  return (
    <section className="bg-white px-5 py-28 md:px-12 md:py-44" aria-label="Features">
      <div className="mx-auto max-w-[110rem]">
        {carData.features.map((f, i) => {
          const l = layouts[i];
          return (
            <article key={f.title}>
              <Rule />
              <div className={cn("grid gap-6 py-14 md:gap-8 md:py-24", l.wrap)}>
                <Reveal className={l.title}>
                  <h3 className={cn("font-display font-black leading-[0.95] tracking-tight", i === 3 ? "text-red" : "text-ink")}>{f.title}</h3>
                </Reveal>
                <Reveal delay={0.12} className={l.text}>
                  <p className="text-lg text-steel md:text-xl">{f.text}</p>
                </Reveal>
              </div>
            </article>
          );
        })}
        <Rule />
      </div>
    </section>
  );
}
