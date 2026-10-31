'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Heart, RotateCcw } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { useStore } from '@/mocks/store';
import { formatINR } from '@/lib/format';
import { cn } from '@/lib/cn';
import { STORE_PRODUCTS } from '@/mocks/fixtures';

export type FittingAudience = 'men' | 'women' | 'kids';

interface FittingLook {
  id: string;
  title: string;
  cat: string;
  priceINR: number;
  image: string;
}

interface FittingSet {
  base: FittingLook & { badge: string };
  cards: FittingLook[];
}

const AUDIENCE_LABELS: Record<FittingAudience, string> = {
  men: 'Men',
  women: 'Women',
  kids: 'Kids',
};

// Looks come straight from the catalog: each audience shows the pieces whose
// placeholder model photo matches it (men: /images/lifestyle, women:
// /images/about), so the name, price and picture on a card stay together.
const MODEL_FOLDER: Record<FittingAudience, string> = {
  men: '/images/lifestyle/',
  women: '/images/about/',
  kids: '/images/kids/',
};

function buildFittingSet(audience: FittingAudience): FittingSet {
  const looks: FittingLook[] = STORE_PRODUCTS.filter((p) => {
    const url = p.images[0]?.url || '';
    return url.startsWith(MODEL_FOLDER[audience]) && Boolean(p.audience?.includes(audience));
  })
    .slice(0, 4)
    .map((p) => ({
      id: p.id,
      title: p.title,
      cat: p.title.split(' ').slice(-1)[0].toUpperCase(),
      priceINR: p.priceINR,
      image: encodeURI(p.images[0].url),
    }));
  return { base: { ...looks[0], badge: 'Printed to order' }, cards: looks };
}

const FITTING_SETS: Record<FittingAudience, FittingSet> = {
  men: buildFittingSet('men'),
  women: buildFittingSet('women'),
  kids: buildFittingSet('kids'),
};

// Only offer tabs that have at least one photographed piece.
const AUDIENCE_ORDER = (['men', 'women', 'kids'] as FittingAudience[]).filter(
  (key) => FITTING_SETS[key].cards.length > 0
);

export default function VirtualFittingRoom() {
  const { isInWishlist, toggleWishlist } = useStore();
  const [audience, setAudience] = useState<FittingAudience>('men');
  const [current, setCurrent] = useState(-1);
  const [liveMsg, setLiveMsg] = useState('Men base look.');

  const set = FITTING_SETS[audience];
  const [underSrc, setUnderSrc] = useState(set.base.image);
  const [topSrc, setTopSrc] = useState(set.base.image);
  const [topClip, setTopClip] = useState('inset(0 0 0% 0)');

  const busyRef = useRef(false);
  const queuedRef = useRef<number | null>(null);
  const currentRef = useRef(-1);
  const currentDisplayedSrcRef = useRef(set.base.image);
  const audienceRef = useRef<FittingAudience>('men');
  const reducedRef = useRef(false);
  const runRef = useRef(0);

  const stageRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const baseImgRef = useRef<HTMLImageElement>(null);
  const topLayerRef = useRef<HTMLDivElement>(null);
  const topImgRef = useRef<HTMLImageElement>(null);
  const scanRef = useRef<HTMLSpanElement>(null);

  const worn = current >= 0 ? set.cards[current] : null;

  useEffect(() => {
    reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Pre-decode all audience images so repeat clicks and transitions run instantly
  useEffect(() => {
    const urls = [FITTING_SETS[audience].base.image, ...FITTING_SETS[audience].cards.map((c) => c.image)];
    urls.forEach((src) => {
      const im = new Image();
      im.src = src;
      void im.decode?.().catch(() => undefined);
    });
  }, [audience]);

  const preloadSrc = useCallback((src: string): Promise<void> => {
    return new Promise((resolve) => {
      const im = new Image();
      let done = false;
      const finish = () => {
        if (!done) {
          done = true;
          resolve();
        }
      };
      const timer = window.setTimeout(finish, 800);
      im.onload = () => {
        window.clearTimeout(timer);
        if (im.decode) {
          im.decode().then(finish, finish);
        } else finish();
      };
      im.onerror = () => {
        window.clearTimeout(timer);
        finish();
      };
      im.src = src;
    });
  }, []);

  const play = useCallback(
    async (t: number) => {
      const startedAudience = audienceRef.current;
      const activeSet = FITTING_SETS[startedAudience];
      const wear = t >= 0;
      const targetLook = wear ? activeSet.cards[t] : null;
      const targetSrc = targetLook ? targetLook.image : activeSet.base.image;
      const currentSrc = currentDisplayedSrcRef.current;

      // If target is already on display and not animating, nothing to change
      if (t === currentRef.current && targetSrc === currentSrc) {
        return;
      }

      busyRef.current = true;
      const runId = ++runRef.current;
      const isStale = () => runId !== runRef.current || audienceRef.current !== startedAudience;

      // Reduced motion fallback: instant swap without scan line
      if (reducedRef.current) {
        currentRef.current = t;
        currentDisplayedSrcRef.current = targetSrc;
        setCurrent(t);
        setUnderSrc(targetSrc);
        setTopSrc(targetSrc);
        setTopClip('inset(0 0 0% 0)');
        setLiveMsg(targetLook ? `Now wearing: ${targetLook.title}` : `${AUDIENCE_LABELS[startedAudience]} base look.`);
        busyRef.current = false;
        const next = queuedRef.current;
        queuedRef.current = null;
        if (next !== null && next !== t && audienceRef.current === startedAudience) {
          play(next);
        }
        return;
      }

      try {
        await preloadSrc(targetSrc);
        if (isStale()) {
          busyRef.current = false;
          return;
        }

        const top = topLayerRef.current;
        const topImg = topImgRef.current;
        const baseImg = baseImgRef.current;
        const scan = scanRef.current;
        const stage = stageRef.current;

        if (!top || !topImg || !baseImg || !scan || !stage) {
          busyRef.current = false;
          return;
        }

        // 1. Stage the currently visible look underneath
        baseImg.src = currentSrc;

        // 2. Prepare the incoming target look on the top layer
        topImg.src = targetSrc;
        try {
          await topImg.decode?.();
        } catch {
          // ignore decode errors
        }
        if (isStale()) {
          busyRef.current = false;
          return;
        }

        // 3. Reset top layer to clipped at top
        top.style.clipPath = 'inset(0 0 100% 0)';
        void top.offsetWidth;

        const stageHeight = stage.offsetHeight || 600;
        const DURATION = 550;
        const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

        // 4. Run synchronized scan line and clip-path wipe from top to bottom
        const clipAnim = top.animate(
          [
            { clipPath: 'inset(0 0 100% 0)' },
            { clipPath: 'inset(0 0 0% 0)' },
          ],
          { duration: DURATION, easing: EASING, fill: 'forwards' }
        );

        const scanAnim = scan.animate(
          [
            { transform: 'translateY(-2px)', opacity: 0 },
            { transform: 'translateY(0px)', opacity: 1, offset: 0.05 },
            { transform: `translateY(${stageHeight - 8}px)`, opacity: 1, offset: 0.92 },
            { transform: `translateY(${stageHeight}px)`, opacity: 0 },
          ],
          { duration: DURATION, easing: EASING, fill: 'forwards' }
        );

        const stagePulse = stage.animate(
          [
            { transform: 'scale(1)' },
            { transform: 'scale(1.008)', offset: 0.5 },
            { transform: 'scale(1)' },
          ],
          { duration: DURATION, easing: 'ease-in-out' }
        );

        await Promise.all([
          clipAnim.finished.catch(() => undefined),
          scanAnim.finished.catch(() => undefined),
          stagePulse.finished.catch(() => undefined),
        ]);

        if (isStale()) {
          busyRef.current = false;
          return;
        }

        // 5. Commit DOM styles to target state
        top.style.clipPath = 'inset(0 0 0% 0)';
        baseImg.src = targetSrc;

        // 6. Synchronize React state with DOM
        currentRef.current = t;
        currentDisplayedSrcRef.current = targetSrc;
        setCurrent(t);
        setUnderSrc(targetSrc);
        setTopSrc(targetSrc);
        setTopClip('inset(0 0 0% 0)');
        setLiveMsg(targetLook ? `Now wearing: ${targetLook.title}` : `${AUDIENCE_LABELS[startedAudience]} base look.`);

        try {
          clipAnim.cancel();
          scanAnim.cancel();
          stagePulse.cancel();
        } catch {
          // noop
        }
      } catch {
        // Safe fallback on unexpected error
        currentRef.current = t;
        currentDisplayedSrcRef.current = targetSrc;
        setCurrent(t);
        setUnderSrc(targetSrc);
        setTopSrc(targetSrc);
        setTopClip('inset(0 0 0% 0)');
      } finally {
        busyRef.current = false;
        const next = queuedRef.current;
        queuedRef.current = null;
        if (next !== null && next !== currentRef.current && audienceRef.current === startedAudience) {
          play(next);
        }
      }
    },
    [preloadSrc]
  );

  const enqueue = useCallback(
    (t: number) => {
      if (busyRef.current) {
        queuedRef.current = t;
        return;
      }
      play(t);
    },
    [play]
  );

  const requestWear = useCallback(
    (i: number) => {
      if (i === currentRef.current) {
        if (i === -1) {
          const stage = stageRef.current;
          if (stage && !reducedRef.current) {
            const pulse = stage.animate(
              [{ transform: 'scale(1)' }, { transform: 'scale(1.012)' }, { transform: 'scale(1)' }],
              { duration: 350, easing: 'ease-in-out' }
            );
            pulse.finished.catch(() => undefined);
          }
          setLiveMsg(`${AUDIENCE_LABELS[audienceRef.current]} base look.`);
          return;
        }
        // If the look is already worn, clicking it again resets back to base look
        enqueue(-1);
        return;
      }
      enqueue(i);
    },
    [enqueue]
  );


  const switchAudience = useCallback((key: FittingAudience) => {
    if (key === audienceRef.current) return;
    runRef.current += 1;
    audienceRef.current = key;
    setAudience(key);
    queuedRef.current = null;
    currentRef.current = -1;
    const newBase = FITTING_SETS[key].base.image;
    currentDisplayedSrcRef.current = newBase;
    busyRef.current = false;
    setCurrent(-1);
    setUnderSrc(newBase);
    setTopSrc(newBase);
    setTopClip('inset(0 0 0% 0)');
    setLiveMsg(`${AUDIENCE_LABELS[key]} base look.`);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && currentRef.current !== -1) requestWear(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [requestWear]);

  const handleRoomMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reducedRef.current || e.pointerType === 'touch') return;
    const tilt = tiltRef.current;
    if (!tilt) return;
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    tilt.style.transform = `perspective(1200px) rotateY(${nx * 3}deg) rotateX(${-ny * 3}deg)`;
  };

  const resetRoomTilt = () => {
    if (tiltRef.current) tiltRef.current.style.transform = '';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header with right-aligned audience tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 sm:mb-12">
        <div>
          <span className="flex items-center gap-3 text-base font-medium uppercase tracking-widest text-store-text-secondary font-sans mb-2">
            <span aria-hidden="true" className="w-7 h-px bg-store-gold" />
            Virtual Fitting Room
          </span>
          <h2 className="font-heading text-[clamp(1.75rem,4vw+0.5rem,3rem)] font-medium tracking-tight text-store-text-primary">
            Choose a piece. Watch it get worn.
          </h2>
          <p className="text-lg text-store-text-secondary font-sans mt-2 max-w-lg">
            Tap any garment and it slides onto the same model — no changing room needed.
          </p>
        </div>

        {/* Audience tabs aligned to the right */}
        <div
          role="tablist"
          aria-label="Fitting room audience"
          className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 shrink-0 self-start md:self-auto"
        >
          {AUDIENCE_ORDER.map((key) => {
            const isActive = key === audience;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => switchAudience(key)}
                className={cn(
                  'px-5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer',
                  isActive
                    ? 'bg-store-action-primary text-white shadow-xs'
                    : 'bg-transparent text-store-text-secondary border border-store-border hover:border-store-action-primary hover:text-store-text-primary'
                )}
              >
                {AUDIENCE_LABELS[key]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fitting room layout */}
      <div
        className="vfr-room"
        onPointerMove={handleRoomMove}
        onPointerLeave={resetRoomTilt}
      >
        <div className="vfr-track">
          {set.cards.map((look, i) => {
            const isOn = current === i;
            const isFav = isInWishlist(look.id);
            return (
              <div key={look.id} className="vfr-slot">
                <button
                  type="button"
                  aria-pressed={isOn}
                  aria-label={isOn ? `${look.title} is on the model, tap to remove` : `Wear ${look.title}`}
                  onClick={() => requestWear(i)}
                  className={cn('vfr-card', isOn ? 'vfr-card-on' : '')}
                >
                  <span className="vfr-ph">
                    <span aria-hidden="true" className="vfr-num">
                      {i + 1}
                    </span>
                    <img
                      src={look.image}
                      alt={look.title}
                      width={941}
                      height={1672}
                      loading="lazy"
                      draggable={false}
                    />
                  </span>
                </button>
                <div className="flex items-start justify-between gap-2 px-1 pt-2">
                  <div>
                    <p className="font-sans text-base font-medium text-store-text-primary">{look.title}</p>
                    <p className="text-xs text-store-text-secondary mt-0.5">
                      {isOn ? 'ON THE MODEL' : `0${i + 1} / ${look.cat} · TAP TO WEAR`}
                    </p>
                    <p className="font-heading font-medium text-base text-store-text-primary tuw-tabular-nums mt-1">
                      {formatINR(look.priceINR * 100)}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-pressed={isFav}
                    aria-label={isFav ? `Remove ${look.title} from wishlist` : `Save ${look.title} to wishlist`}
                    onClick={() => toggleWishlist(look.id)}
                    className="w-8 h-8 rounded-full bg-store-surface border border-store-border flex items-center justify-center transition-all duration-200 hover:bg-store-cream cursor-pointer shrink-0"
                  >
                    <Heart
                      size={14}
                      color="currentColor"
                      className={cn(isFav ? 'fill-secondary-purple text-secondary-purple' : 'text-store-text-primary')}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Center model stage */}
        <div className="vfr-stage-col">
          <div ref={tiltRef} className="vfr-stage-tilt">
            <div
              ref={stageRef}
              role="img"
              aria-label={`Model wearing ${worn ? worn.title : set.base.title}`}
              className="vfr-stage"
            >
              {/* Underneath layer (currently displayed look) */}
              <div className="vfr-layer">
                <img
                  ref={baseImgRef}
                  src={underSrc}
                  alt=""
                  width={941}
                  height={1672}
                  draggable={false}
                />
              </div>

              {/* Top layer (incoming look revealed by scan) */}
              <div
                ref={topLayerRef}
                className="vfr-layer"
                style={{ clipPath: topClip }}
              >
                <img
                  ref={topImgRef}
                  src={topSrc}
                  alt=""
                  width={941}
                  height={1672}
                  draggable={false}
                />
              </div>

              {/* Gold laser scan beam */}
              <span ref={scanRef} aria-hidden="true" className="vfr-scan" />

              <div className="absolute top-4 left-4 z-10">
                <Badge variant="dark" size="sm">
                  {set.base.badge}
                </Badge>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-base font-medium uppercase tracking-widest text-store-text-secondary font-sans">
              {worn ? 'Now wearing' : 'Base look'} • {AUDIENCE_LABELS[audience]}
            </p>
            <p className="font-heading text-base font-medium text-store-text-primary mt-1">
              {worn ? worn.title : set.base.title}
              <br /> 
              <span className="tuw-tabular-nums font-medium">{formatINR((worn ? worn.priceINR : set.base.priceINR) * 100)}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => requestWear(-1)}
            className="inline-flex items-center gap-2 px-6 h-11 rounded-full border border-store-action-primary bg-transparent text-store-action-primary hover:bg-store-action-primary hover:text-white font-sans font-medium text-xs tracking-wider uppercase transition-all duration-200 cursor-pointer"
          >
            <RotateCcw size={14} color="currentColor" aria-hidden="true" />
            <span>Reset look</span>
          </button>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {liveMsg}
      </p>
    </div>
  );
}
