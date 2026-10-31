'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import TuwEmblem from './TuwEmblem';

// The intro plays once per browser session, on the homepage only, so deep
// links (shared product pages) and repeat visits open straight to content.
const INTRO_SEEN_KEY = 'tuw_intro_seen';

// Runs while the server HTML is parsed, before first paint: hides the overlay
// for visitors who already saw it this session, avoiding a dark flash.
const INTRO_SEEN_SCRIPT = `try{if(sessionStorage.getItem('${INTRO_SEEN_KEY}')==='1')document.documentElement.setAttribute('data-intro-seen','')}catch(e){}`;

const BRAND_WORDS = [
  { word: 'THE', chars: ['T', 'H', 'E'] },
  { word: 'UNPLUGGED', chars: ['U', 'N', 'P', 'L', 'U', 'G', 'G', 'E', 'D'] },
  { word: 'WEAR', chars: ['W', 'E', 'A', 'R'] },
];

function markIntroSeen() {
  try {
    sessionStorage.setItem(INTRO_SEEN_KEY, '1');
  } catch {
    // Storage blocked: the intro may replay, which is harmless.
  }
}

export default function BrandIntro() {
  // Homespace ID Staggered Letter-by-Letter Architecture:
  // 1. Initial State (0ms - 100ms): Dark stage; official leaping deer stag emblem blooms
  // 2. Letter-by-Letter Load (320ms - 1100ms): 16 letters ascend sequentially through masked viewports (45ms stagger)
  // 3. Brand Crest Settle (1250ms): Gold accent rule and slow-living atelier sub-mark fade in
  // 4. Shutter Up Curtain Transition (2050ms): Shutter sweeps straight UP (translateY -120vh) unveiling the home page
  // 5. Completion (3000ms): Clean unmount from DOM, restoring viewport scrolling
  const [emblemVisible, setEmblemVisible] = useState(false);
  const [lettersVisible, setLettersVisible] = useState(false);
  const [taglineVisible, setTaglineVisible] = useState(false);
  const [shutterUp, setShutterUp] = useState(false);
  const [done, setDone] = useState(false);
  const isHome = usePathname() === '/';

  useEffect(() => {
    // 1. Accessibility: check for prefers-reduced-motion
    if (!isHome) {
      setDone(true);
      return;
    }
    if (typeof window !== 'undefined') {
      // Read only here; the flag is written when the intro finishes or is
      // skipped, so React's dev double-effect cannot mark it seen too early.
      let seenThisSession = false;
      try {
        seenThisSession = sessionStorage.getItem(INTRO_SEEN_KEY) === '1';
      } catch {
        // Storage blocked (private mode): fall back to playing the intro.
      }
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion || seenThisSession) {
        setDone(true);
        return;
      }
      document.body.style.overflow = 'hidden';
    }

    // Step 1 (100ms): Leaping deer stag emblem blooms
    const tEmblem = setTimeout(() => {
      setEmblemVisible(true);
    }, 100);

    // Step 2 (320ms): Letters begin loading one by one
    const tLetters = setTimeout(() => {
      setLettersVisible(true);
    }, 320);

    // Step 3 (1250ms): Subtitle & gold rule fade in
    const tTagline = setTimeout(() => {
      setTaglineVisible(true);
    }, 1250);

    // Step 4 (2050ms): Curtain sweeps upward into home page
    const tShutter = setTimeout(() => {
      setShutterUp(true);
      if (typeof window !== 'undefined') {
        document.body.style.overflow = '';
      }
    }, 2050);

    // Step 5 (3000ms): Unmount from DOM after animation clears
    const tDone = setTimeout(() => {
      markIntroSeen();
      setDone(true);
    }, 3000);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (typeof window !== 'undefined') {
          document.body.style.overflow = '';
        }
        markIntroSeen();
        setDone(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(tEmblem);
      clearTimeout(tLetters);
      clearTimeout(tTagline);
      clearTimeout(tShutter);
      clearTimeout(tDone);
      if (typeof window !== 'undefined') {
        document.body.style.overflow = '';
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isHome]);

  if (!isHome || done) {
    return null;
  }

  const handleSkip = () => {
    if (typeof window !== 'undefined') {
      document.body.style.overflow = '';
    }
    markIntroSeen();
    setDone(true);
  };

  // Compute global running letter index for smooth cross-word staggering
  let globalCharIndex = 0;

  return (
    <>
    <script dangerouslySetInnerHTML={{ __html: INTRO_SEEN_SCRIPT }} />
    <aside
      aria-label="The Unplugged Wear Brand Introduction"
      aria-live="polite"
      onClick={handleSkip}
      className={`intro-shutter-wrap select-none cursor-pointer ${
        shutterUp ? 'intro-shutter-up' : ''
      }`}
    >
      {/* Centered Brand Presentation matching Homespace ID standard */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 max-w-5xl mx-auto text-center pointer-events-none">
        {/* Official Leaping Deer Stag Emblem */}
        <div
          className={`intro-emblem-motion flex items-center justify-center mb-5 sm:mb-6 ${
            emblemVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-90'
          }`}
        >
          <TuwEmblem className="w-16 h-16 sm:w-20 sm:h-20 text-white drop-shadow-2xl" />
        </div>

        {/* Brand Text Wrapper with Staggered Letter-by-Letter Masks.
            Rendered as <p> rather than <h1> so the page keeps exactly one
            content heading (the hero) for crawlers and screen readers. */}
        <p className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-2 intro-brand-typography font-heading font-medium text-white tracking-tight">
          {BRAND_WORDS.map((item, wordIdx) => (
            <span key={wordIdx} className="inline-flex items-center whitespace-nowrap">
              {item.chars.map((char, charIdx) => {
                const currentDelay = globalCharIndex * 45;
                globalCharIndex += 1;
                return (
                  <span
                    key={charIdx}
                    className={`intro-letter-mask ${
                      lettersVisible ? 'intro-letter-revealed' : ''
                    }`}
                  >
                    <span
                      style={{
                        transitionDelay: lettersVisible ? `${currentDelay}ms` : '0ms',
                      }}
                      className="intro-letter-char"
                    >
                      {char}
                    </span>
                  </span>
                );
              })}
            </span>
          ))}
        </p>

        {/* Architectural Subtitle & Refined Gold Accent Rule */}
        <div
          className={`flex flex-col items-center space-y-3 mt-5 sm:mt-6 transition-all duration-700 ${
            taglineVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="w-16 h-px bg-store-gold opacity-80" />
          <p className="font-sans font-medium text-sm  uppercase tracking-widest text-white/70">
            Slow-Living Luxury • Architectural Form
          </p>
        </div>
      </div>

      {/* Architectural Shutter Bottom Lip (20vh tail extending below panel) */}
      <div className="intro-shutter-lip">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-store-gold/40 to-transparent" />
      </div>

      {/* Accessible Skip Button */}
      <button
        type="button"
        onClick={handleSkip}
        className="absolute top-6 right-6 min-h-6 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-sans uppercase tracking-wider text-white/80 hover:text-white transition-colors z-20 cursor-pointer pointer-events-auto"
      >
        Skip [Esc]
      </button>
    </aside>
    </>
  );
}
