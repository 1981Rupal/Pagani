import { carData } from "@/data/carData";

export default function Footer() {
  const { brand, footer } = carData;
  return (
    <footer id="contact" className="border-t border-line bg-white px-5 py-14 md:px-12 md:py-20">
      <div className="mx-auto grid max-w-[110rem] gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="font-display text-2xl font-black tracking-[0.3em] text-ink">{brand.name}</p>
          <p className="mt-3 font-display text-[0.7rem] font-medium leading-relaxed tracking-[0.3em] text-steel">
            {brand.maker}
            <span className="block">{brand.city}, {brand.country}</span>
          </p>
        </div>
        <nav aria-label="Footer" className="md:col-span-5 md:col-start-8">
          <ul className="flex flex-wrap gap-x-8 gap-y-3">
            {footer.links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="font-display text-[0.7rem] font-semibold tracking-[0.25em] text-ink transition-colors duration-300 hover:text-red">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <p className="mx-auto mt-16 max-w-[110rem] border-t border-line pt-6 font-display text-[0.65rem] tracking-[0.3em] text-steel">
        {carData.copyright}
      </p>
    </footer>
  );
}
