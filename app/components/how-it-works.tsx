"use client";

// How-it-works section. Currently the static three-step cards; the pinned
// scroll-driven stage (md+) replaces the desktop grid in a follow-up task.

import BlurText from "./blur-text";
import { EditorDemo, StampDemo, MiniPhoneDemo } from "./micro-demos";

export const steps = [
  {
    title: "Upload your menu",
    body: "Add dishes, prices, and photos in a simple editor. We turn each photo into a 3D model — no scanning or special gear needed.",
    demo: <EditorDemo />,
  },
  {
    title: "Print the QR code",
    body: "One code per table, or one for the whole room. It never changes, even when the menu does.",
    demo: <StampDemo />,
  },
  {
    title: "Diners explore the food",
    body: "The code opens your menu in 3D. No app, no account, no waiting for a server to explain.",
    demo: <MiniPhoneDemo />,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 border-t border-hairline">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-28">
        <h2 className="font-display text-[clamp(1.9rem,3.5vw,2.6rem)] font-medium leading-[1.1] tracking-[-0.02em] text-phosphor">
          <BlurText text="How it works" />
        </h2>
        <div className="mt-14 -mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:grid md:snap-none md:grid-cols-3 md:gap-0 md:divide-x md:divide-hairline md:overflow-visible md:px-0 md:pb-0">
          {steps.map((step) => (
            <div
              key={step.title}
              className="w-[85%] shrink-0 snap-center rounded-lg border border-hairline bg-ground p-6 sm:w-[55%] md:w-auto md:shrink md:rounded-none md:border-0 md:bg-transparent md:p-0 md:px-10 md:first:pl-0 md:last:pr-0"
            >
              {step.demo}
              <h3 className="mt-6 font-display text-[22px] font-medium tracking-[-0.013em] text-mint">
                {step.title}
              </h3>
              <p className="mt-3 max-w-[38ch] text-[15px] leading-relaxed text-sage">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
