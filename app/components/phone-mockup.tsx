import Image from "next/image";
import StickerPeel from "./sticker-peel";
import { QrCode } from "./qr-code";
import { dishes } from "./menu-data";

export function PhoneMockup() {
  return (
    <div className="relative mx-auto w-fit">
      {/* Emerald halo */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-[220px] -z-10 h-[560px] w-[880px] max-w-[96vw] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            "radial-gradient(closest-side, rgba(47,158,110,0.38), rgba(47,158,110,0.12) 55%, transparent 78%)",
        }}
      />

      {/* QR chip docked to the frame: peels like a table sticker on hover */}
      <div className="absolute -right-10 -top-8 z-10 hidden rotate-6 sm:block">
        <StickerPeel>
          <div className="w-28 rounded-lg bg-[#fdfefd] p-2.5 text-[#111511]">
            <QrCode />
            <p className="mt-1.5 text-center text-[9px] font-medium tracking-wide text-[#3c463c]">
              SCAN FOR MENU
            </p>
          </div>
        </StickerPeel>
      </div>

      {/* Phone frame */}
      <div className="w-[300px] rounded-[2.9rem] border border-circuit/70 bg-carbon p-2 sm:w-[320px]">
        <div className="relative overflow-hidden rounded-[2.4rem] bg-[#0b0e0c]">
          {/* Status bar + island */}
          <div className="flex items-center justify-between px-7 pt-3.5 text-[11px] font-medium text-mint">
            <span>9:41</span>
            <div className="absolute left-1/2 top-2.5 h-5 w-20 -translate-x-1/2 rounded-full bg-[#030503]" />
            <svg width="34" height="11" viewBox="0 0 34 11" fill="currentColor" aria-hidden="true">
              <rect x="0" y="6" width="3" height="5" rx="1" />
              <rect x="5" y="4" width="3" height="7" rx="1" />
              <rect x="10" y="2" width="3" height="9" rx="1" />
              <rect x="17" y="2" width="14" height="8" rx="2.5" opacity="0.5" />
              <rect x="18.5" y="3.5" width="9" height="5" rx="1.5" />
            </svg>
          </div>

          {/* Restaurant header */}
          <div className="flex items-baseline justify-between px-5 pb-3 pt-5">
            <p className="font-display text-[17px] font-medium text-phosphor">The Brass Fig</p>
            <p className="text-[11px] text-sage-dim">Table 12</p>
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 px-5 pb-4 text-[12px] font-medium">
            <span className="rounded-full bg-emerald px-3 py-1 text-ink-emerald">Mains</span>
            <span className="rounded-full border border-pine px-3 py-1 text-fern">Starters</span>
            <span className="rounded-full border border-pine px-3 py-1 text-fern">Desserts</span>
          </div>

          {/* Dish grid */}
          <div className="grid grid-cols-2 gap-2.5 px-4 pb-5">
            {dishes.map((dish) => (
              <figure key={dish.name} className="overflow-hidden rounded-xl bg-ground">
                <div className="relative aspect-square">
                  <Image
                    src={dish.img}
                    alt={dish.alt}
                    fill
                    sizes="150px"
                    className="object-cover"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10"
                  />
                </div>
                <figcaption className="px-2.5 py-2">
                  <p className="text-[11px] font-medium leading-snug text-mint">{dish.name}</p>
                  <p className="mt-0.5 text-[11px] tabular-nums text-sage-dim">{dish.price}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
