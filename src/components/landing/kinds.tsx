import { t, tr } from "@/i18n";

export function Kinds() {
  const items = tr<string[]>("landing.kinds.items");
  return (
    <section
      aria-label={t("landing.kinds.title")}
      className="border-y border-border bg-brand-plum text-brand-cream"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-5 sm:px-6">
        <p className="font-heading text-sm font-semibold tracking-wide uppercase opacity-70">
          {t("landing.kinds.title")}
        </p>
        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {items.map((item) => (
            <li key={item} className="font-serif text-xl italic">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
