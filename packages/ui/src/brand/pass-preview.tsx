import {
  Armchair,
  Croissant,
  Coffee,
  Drumstick,
  Heart,
  IceCreamCone,
  Scissors,
  Star,
  type LucideIcon,
} from "lucide-react";
import { t } from "@sellora/shared/i18n";
import type { BusinessConfig } from "@sellora/shared/business/config";

const ICONS: Record<BusinessConfig["passDesign"]["stampIcon"], LucideIcon> = {
  star: Star,
  coffee: Coffee,
  bread: Croissant,
  scissors: Scissors,
  chicken: Drumstick,
  icecream: IceCreamCone,
  heart: Heart,
};

/** Mismo reparto que el strip del pase real: una fila hasta 6 sellos, dos hasta 12 y tres hasta 20. */
function columnsFor(total: number): number {
  const rows = total <= 6 ? 1 : total <= 12 ? 2 : 3;
  return Math.ceil(total / rows);
}

interface Props {
  config: {
    identity: Pick<BusinessConfig["identity"], "name">;
    passDesign: BusinessConfig["passDesign"];
    rules: Pick<BusinessConfig["rules"], "stampsRequired" | "reward">;
  };
  stamps: number;
}

/** Réplica aproximada de cómo se ve el pase en Wallet. Los colores salen de la config del negocio. */
export function PassPreview({ config, stamps }: Props) {
  const { backgroundColor, foregroundColor, labelColor, stampIcon } = config.passDesign;
  const total = config.rules.stampsRequired;
  const Icon = ICONS[stampIcon] ?? Armchair;
  const filled = Math.min(Math.max(stamps, 0), total);

  return (
    <div
      role="img"
      aria-label={`${config.identity.name}. ${t("app.card.stamps", { current: filled, total })}. ${config.rules.reward}`}
      className="mx-auto w-full max-w-xs rounded-3xl p-5 shadow-pop"
      style={{ backgroundColor, color: foregroundColor }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-heading text-lg leading-tight font-extrabold">{config.identity.name}</p>
        <div className="text-right">
          <p className="text-[10px] tracking-wider uppercase" style={{ color: labelColor }}>
            {t("app.card.reward")}
          </p>
          <p className="text-sm font-medium">{config.rules.reward}</p>
        </div>
      </div>

      <ul
        className="mt-5 grid gap-2.5"
        style={{ gridTemplateColumns: `repeat(${columnsFor(total)}, minmax(0, 1fr))` }}
        aria-hidden
      >
        {Array.from({ length: total }, (_, i) => {
          const on = i < filled;
          return (
            <li
              key={i}
              className="grid aspect-square place-items-center rounded-full border-2"
              style={{
                borderColor: labelColor,
                backgroundColor: on ? labelColor : "transparent",
                color: on ? backgroundColor : labelColor,
                opacity: on ? 1 : 0.55,
              }}
            >
              <Icon className="size-1/2" strokeWidth={2.4} />
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-xs" style={{ color: labelColor }}>
        {t("app.card.stamps", { current: filled, total })}
      </p>
    </div>
  );
}
