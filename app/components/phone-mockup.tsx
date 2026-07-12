import Image from "next/image";
import StickerPeel from "./sticker-peel";
import { QrCode } from "./qr-code";

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
        <div className="relative aspect-[390/844] overflow-hidden rounded-[2.4rem] bg-[#0b0e0c]">
          <Image
            src="/images/menu-preview.png"
            alt="MenuViz 3D menu open on a phone — drag to browse dishes, tap to customise"
            fill
            sizes="320px"
            className="object-cover"
            priority
          />
        </div>
      </div>
    </div>
  );
}
