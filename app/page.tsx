import { PhoneMockup } from "./components/phone-mockup";
import BlurText from "./components/blur-text";
import TrueFocus from "./components/true-focus";
import {
  EditorDemo,
  StampDemo,
  MiniPhoneDemo,
  PriceSyncDemo,
  InstantLoadDemo,
  TextToPhotoDemo,
  LanguageDemo,
  LocationRippleDemo,
} from "./components/micro-demos";

const DEMO_URL = "https://cal.com/menuviz/demo";

function ArrowUpRight({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4.5 11.5 11.5 4.5M5.5 4.5h6v6" />
    </svg>
  );
}

/** On hover of the parent `group`, the arrow exits top-right while a twin enters from bottom-left. */
function AnimatedArrow({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <span className={`relative block overflow-hidden ${className}`} aria-hidden="true">
      <ArrowUpRight className="h-full w-full transition-transform duration-300 ease-out-quart group-hover:-translate-y-full group-hover:translate-x-full" />
      <ArrowUpRight className="absolute inset-0 h-full w-full -translate-x-full translate-y-full transition-transform duration-300 ease-out-quart group-hover:translate-x-0 group-hover:translate-y-0" />
    </span>
  );
}

/** Viewfinder mark: corner brackets framing a menu card, echoing the MenuViz logo. */
function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M3 8V6a3 3 0 0 1 3-3h2" />
        <path d="M16 3h2a3 3 0 0 1 3 3v2" />
        <path d="M21 16v2a3 3 0 0 1-3 3h-2" />
        <path d="M8 21H6a3 3 0 0 1-3-3v-2" />
      </g>
      <rect x="8.2" y="7.2" width="7.6" height="9.6" rx="1.6" fill="currentColor" />
    </svg>
  );
}

function Nav() {
  return (
    <header className="fixed inset-x-0 top-4 z-50 px-4">
      <nav className="mx-auto flex max-w-4xl items-center justify-between rounded-full border border-hairline bg-carbon/85 py-1 pl-5 pr-1.5 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)] backdrop-blur-[10px]">
        <a href="#" className="flex items-center gap-2.5" aria-label="MenuViz home">
          <Mark className="h-5 w-5 text-emerald" />
          <span className="font-display text-[17px] font-medium tracking-tight text-phosphor">
            MenuViz
          </span>
        </a>
        <div className="hidden items-center gap-8 text-[14px] font-medium tracking-[-0.026em] text-mint md:flex">
          <a
            href="#how-it-works"
            className="py-2 transition-colors duration-300 hover:text-phosphor"
          >
            How it works
          </a>
          <a href="#faq" className="py-2 transition-colors duration-300 hover:text-phosphor">
            FAQ
          </a>
        </div>
        <a
          href={DEMO_URL}
          target="_blank"
          rel="noopener"
          className="btn-press group relative flex items-center gap-1.5 overflow-hidden rounded-full py-1 pl-3 pr-1 text-[14px] font-medium text-emerald"
        >
          {/* The arrow's circle: scales out to flood the pill on hover */}
          <span
            aria-hidden="true"
            className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-emerald transition-transform duration-[400ms] ease-out-quart group-hover:scale-[12] group-focus-visible:scale-[12]"
          />
          <span className="relative transition-colors duration-300 group-hover:text-ink-emerald group-focus-visible:text-ink-emerald">
            Book a demo
          </span>
          <span className="relative flex h-6 w-6 items-center justify-center text-ink-emerald">
            <AnimatedArrow className="h-3.5 w-3.5" />
          </span>
        </a>
      </nav>
    </header>
  );
}

const particles = [
  { top: "18%", left: "12%", size: 3, opacity: 0.5 },
  { top: "32%", left: "7%", size: 2, opacity: 0.35 },
  { top: "14%", left: "78%", size: 2, opacity: 0.4 },
  { top: "38%", left: "88%", size: 3, opacity: 0.45 },
  { top: "55%", left: "16%", size: 2, opacity: 0.3 },
  { top: "60%", left: "82%", size: 2, opacity: 0.35 },
  { top: "26%", left: "30%", size: 2, opacity: 0.25 },
  { top: "22%", left: "64%", size: 2, opacity: 0.3 },
  { top: "68%", left: "70%", size: 3, opacity: 0.25 },
  { top: "72%", left: "28%", size: 2, opacity: 0.3 },
];

function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pt-40 sm:pt-48">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {particles.map((p, i) => (
          <span
            key={i}
            className="particle absolute rounded-full bg-emerald"
            style={{
              top: p.top,
              left: p.left,
              width: p.size,
              height: p.size,
              opacity: p.opacity,
              animationDelay: `${i * 0.6}s`,
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-3xl text-center">
        <h1
          aria-label="Show the food. Sell more of it."
          className="font-display text-[clamp(2.7rem,7vw,4.5rem)] font-medium leading-[1.02] tracking-[-0.03em]"
        >
          <span aria-hidden="true">
            <BlurText text="Show the food." className="justify-center text-emerald" />
            <BlurText
              text="Sell more of it."
              initialDelay={380}
              className="justify-center text-phosphor"
            />
          </span>
        </h1>
        <p
          className="rise mx-auto mt-6 max-w-[36rem] text-pretty text-[17px] leading-relaxed text-moss-bright sm:text-[19px]"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          A QR code on the table opens your menu as photographs: every dish
          pictured, priced, and up to date. No app, no reprints.
        </p>
        <div
          className="rise mt-9 flex flex-wrap items-center justify-center gap-3"
          style={{ "--i": 2 } as React.CSSProperties}
        >
          <a
            href={DEMO_URL}
            target="_blank"
            rel="noopener"
            className="btn-press group flex items-center gap-1.5 rounded-full bg-emerald py-2.5 pl-4.5 pr-3.5 text-[16px] font-medium text-ink-emerald hover:bg-emerald-deep"
          >
            Book a demo
            <AnimatedArrow className="h-4 w-4" />
          </a>
          <a
            href="#how-it-works"
            className="btn-press rounded-full border border-phosphor/70 px-4.5 py-2.5 text-[16px] font-medium text-phosphor hover:border-phosphor hover:bg-phosphor/5"
          >
            See how it works
          </a>
        </div>
      </div>

      {/* Signature object: the diner menu, cropped at the fold like Modal's cube */}
      <div className="rise relative mt-16" style={{ "--i": 3 } as React.CSSProperties}>
        <div className="max-h-[480px] overflow-hidden pt-10 sm:max-h-[520px]">
          <PhoneMockup />
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
          style={{ background: "linear-gradient(to bottom, transparent, #030503 92%)" }}
        />
      </div>
    </section>
  );
}

function RestaurantStrip() {
  return (
    <div className="mx-auto flex max-w-5xl flex-wrap items-baseline justify-center gap-x-12 gap-y-4 px-6 pb-24 pt-4 text-fern-deep">
      <span className="text-[13px] font-semibold uppercase tracking-[0.22em]">Casa Limón</span>
      <span className="font-display text-[17px] font-medium">The Brass Fig</span>
      <span className="text-[16px] font-bold tracking-tight">noodle&amp;co</span>
      <span className="text-[16px] italic" style={{ fontFamily: "Georgia, serif" }}>
        Petit Four
      </span>
      <span className="text-[13px] font-medium uppercase tracking-[0.14em]">
        Harbor Oyster Bar
      </span>
      <span className="font-display text-[16px]">Sichuan House</span>
    </div>
  );
}

const steps = [
  {
    title: "Upload your menu",
    body: "Add dishes, prices, and photos in a simple editor. Bring your own shots or book a shoot with us.",
    demo: <EditorDemo />,
  },
  {
    title: "Print the QR code",
    body: "One code per table, or one for the whole room. It never changes, even when the menu does.",
    demo: <StampDemo />,
  },
  {
    title: "Diners see the food",
    body: "The code opens your menu as photographs. No app, no account, no waiting for a server to explain.",
    demo: <MiniPhoneDemo />,
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 border-t border-hairline">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-28">
        <h2 className="font-display text-[clamp(1.9rem,3.5vw,2.6rem)] font-medium leading-[1.1] tracking-[-0.02em] text-phosphor">
          How it works
        </h2>
        <div className="mt-14 grid gap-12 md:grid-cols-3 md:gap-0 md:divide-x md:divide-hairline">
          {steps.map((step) => (
            <div key={step.title} className="md:px-10 md:first:pl-0 md:last:pr-0">
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

type Card = {
  statement: string;
  support: string;
  tone: "dark" | "mint" | "wash";
  wide?: boolean;
  demo: React.ReactNode;
};

const cards: Card[] = [
  {
    statement: "Change a price. It's live before the next table sits down.",
    support: "Edit from your phone. Every code at every table updates instantly.",
    tone: "dark",
    wide: true,
    demo: <PriceSyncDemo />,
  },
  {
    statement: "No app. No download.",
    support: "The code opens a page. It loads in about a second.",
    tone: "mint",
    demo: <InstantLoadDemo />,
  },
  {
    statement: "Photos do the selling.",
    support: "Diners order more when they can see the plate.",
    tone: "dark",
    demo: <TextToPhotoDemo />,
  },
  {
    statement: "Any language.",
    support: "Menus translate for whoever scans.",
    tone: "wash",
    demo: <LanguageDemo />,
  },
  {
    statement: "Every location, one menu.",
    support: "Update once, publish everywhere. Prices can still differ by site.",
    tone: "dark",
    demo: <LocationRippleDemo />,
  },
];

function Bento() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24 sm:pb-32">
      <div className="grid gap-5 md:grid-cols-3">
        {cards.map((card) => {
          const dark = card.tone === "dark";
          const statement = (
            <p
              className={[
                "text-balance font-display font-medium leading-[1.15] tracking-[-0.015em]",
                card.wide ? "max-w-[22ch] text-[clamp(1.5rem,2.6vw,2.1rem)]" : "text-[26px]",
                dark ? "text-phosphor" : "text-[#132018]",
              ].join(" ")}
            >
              {card.statement}
            </p>
          );
          const support = (
            <p
              className={[
                "max-w-[36ch] text-[15px] leading-relaxed",
                dark ? "text-sage" : "text-[#3d5a48]",
              ].join(" ")}
            >
              {card.support}
            </p>
          );
          return (
            <div
              key={card.statement}
              className={[
                "min-h-[250px] rounded-lg p-8",
                card.wide ? "md:col-span-2" : "",
                dark ? "bg-ground" : "",
                card.tone === "mint" ? "bg-mint" : "",
              ].join(" ")}
              style={
                card.tone === "wash"
                  ? {
                      background:
                        "radial-gradient(130% 130% at 15% 0%, #eaf6e6 0%, #cfeccf 45%, #7cc79b 100%)",
                    }
                  : undefined
              }
            >
              {card.wide ? (
                <div className="grid h-full gap-8 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="flex h-full flex-col justify-between gap-8">
                    {statement}
                    {support}
                  </div>
                  {card.demo}
                </div>
              ) : (
                <div className="flex h-full flex-col">
                  {statement}
                  <div className="flex flex-1 items-center justify-center py-7">{card.demo}</div>
                  {support}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

const faqs = [
  {
    q: "How long does setup take?",
    a: "Most menus are live within a week. The editor takes minutes; photography is the long pole, and you can launch with the photos you already have.",
  },
  {
    q: "Who takes the photos?",
    a: "Either you do, or we do. Upload your own shots, or book one of our photographers for a half-day shoot of your best sellers.",
  },
  {
    q: "Do diners need to download anything?",
    a: "No. The QR code opens a web page straight from the phone's camera. Nothing to install, nothing to sign into.",
  },
  {
    q: "How do I update the menu?",
    a: "Log in, change the dish or the price, done. The printed codes never need replacing.",
  },
  {
    q: "What does it cost?",
    a: "A flat monthly fee per location, with no per-scan charges. We walk through exact pricing on the demo.",
  },
];

function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 border-t border-hairline">
      <div className="mx-auto max-w-3xl px-6 py-24 sm:py-28">
        <h2 className="font-display text-[clamp(1.9rem,3.5vw,2.6rem)] font-medium leading-[1.1] tracking-[-0.02em] text-phosphor">
          Common questions
        </h2>
        <div className="mt-10">
          {faqs.map((item) => (
            <details key={item.q} className="faq-item group border-b border-hairline">
              <summary className="flex items-center justify-between gap-6 py-5 text-[16px] font-medium text-mint transition-colors duration-300 hover:text-phosphor sm:text-[17px]">
                {item.q}
                <svg
                  className="faq-icon h-4 w-4 shrink-0 text-fern"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <path d="M8 2v12M2 8h12" />
                </svg>
              </summary>
              <p className="max-w-[60ch] pb-6 text-[15px] leading-relaxed text-sage">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="border-t border-hairline">
      <div className="mx-auto max-w-3xl px-6 py-28 text-center sm:py-36">
        <h2
          aria-label="Put your menu in pictures."
          className="font-display text-[clamp(2.1rem,5vw,3.4rem)] font-medium leading-[1.05] tracking-[-0.025em] text-phosphor"
        >
          <span aria-hidden="true">
            <TrueFocus sentence="Put your menu in pictures." />
          </span>
        </h2>
        <p className="mx-auto mt-5 max-w-[34rem] text-[16px] leading-relaxed text-sage sm:text-[17px]">
          A fifteen minute walkthrough, with your own menu on the screen.
        </p>
        <a
          href={DEMO_URL}
          target="_blank"
          rel="noopener"
          className="btn-press group mt-9 inline-flex items-center gap-1.5 rounded-full bg-emerald py-2.5 pl-4.5 pr-3.5 text-[16px] font-medium text-ink-emerald hover:bg-emerald-deep"
        >
          Book a demo
          <AnimatedArrow className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-10">
        <div className="flex items-center gap-2.5">
          <Mark className="h-4 w-4 text-emerald" />
          <span className="font-display text-[15px] font-medium text-phosphor">MenuViz</span>
        </div>
        <a
          href="mailto:hello@menuviz.app"
          className="py-2.5 text-[14px] text-fern transition-colors duration-300 hover:text-moss"
        >
          hello@menuviz.app
        </a>
        <p className="text-[13px] text-fern-deep">© 2026 MenuViz</p>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <RestaurantStrip />
        <HowItWorks />
        <Bento />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
