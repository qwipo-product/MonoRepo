
import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useMotion } from "../lib/motion-context";
import { appScreens, type AppScreen } from "../data/app-screens";
import { ProgressiveImage, type ImageAsset } from "./ProgressiveImage";

const screens: AppScreen[] = ["distributor", "catalogue", "cart", "tracking"];
const TRANSITION_DURATION = 1.15;
const BASE_AUTOPLAY_DELAY = 5;
const AUTOPLAY_FREQUENCY_MULTIPLIER = 1.15;
// Increase full-cycle frequency while preserving the handoff's duration.
const AUTOPLAY_DELAY =
  (BASE_AUTOPLAY_DELAY + TRANSITION_DURATION) / AUTOPLAY_FREQUENCY_MULTIPLIER -
  TRANSITION_DURATION;

export function OrbitProductDevice({ review = false }: { review?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const requestedRef = useRef(0);
  const selectRef = useRef<(index: number) => void>(() => {});
  const [requested, setRequested] = useState(0);
  const [visible, setVisible] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [moving, setMoving] = useState(false);
  const [ready, setReady] = useState<Partial<Record<ImageAsset, boolean>>>({});
  const enabled = useMotion();
  const next = (requested + 1) % screens.length;

  const markReady = useCallback((screen: ImageAsset) => {
    setReady((previous) =>
      previous[screen] ? previous : { ...previous, [screen]: true },
    );
  }, []);
  const select = useCallback((index: number) => {
    requestedRef.current = index;
    setRequested(index);
    selectRef.current(index);
  }, []);

  useEffect(() => {
    const viewport = root.current?.querySelector(".device-orbit-viewport");
    if (!viewport) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.15 },
    );
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = root.current;
    const panel = element?.closest<HTMLElement>(".product-stage");
    const viewport = element?.querySelector<HTMLElement>(
      ".device-orbit-viewport",
    );
    if (!element || !panel || !viewport) return;
    const phones = Array.from(
      element.querySelectorAll<HTMLElement>(".device-orbit-handset"),
    );
    let current = requestedRef.current;
    let transition: gsap.core.Timeline | null = null;
    let angle = 65;
    let dimensions = "";
    const context = gsap.context(() => {}, element);

    const settle = (index: number) => {
      transition?.kill();
      transition = null;
      current = index;
      phones.forEach((phone, phoneIndex) => {
        gsap.set(phone, {
          rotation: 0,
          autoAlpha: phoneIndex === index ? 1 : 0,
        });
        phone.dataset.orbitState = phoneIndex === index ? "rest" : "hidden";
      });
      element.dataset.orbitMoving = "false";
      setMoving(false);
    };

    const measure = () => {
      const width = phones[0].offsetWidth;
      const height = phones[0].offsetHeight;
      const view = viewport.getBoundingClientRect();
      const stage = panel.getBoundingClientRect();
      const size = `${width}:${height}:${view.width}:${view.height}:${stage.height}`;
      if (size === dimensions) return;
      dimensions = size;
      if (transition) settle(requestedRef.current);
      // The phone starts at the top of a circle whose centre is below the
      // entire purple panel, including the fixed navigation and attribution.
      const phoneTop = Number.parseFloat(getComputedStyle(viewport).paddingTop);
      const centreY = view.top + phoneTop + height / 2;
      const radius = Math.max(stage.bottom - centreY + 72, stage.width * 2);
      // Find a fully clipped endpoint, allowing for the tilted phone and shadow.
      // Both phones then travel the same angular distance at the same time.
      for (angle = 10; angle < 120; angle += 0.5) {
        const radians = (angle * Math.PI) / 180;
        const halfWidth =
          (width * Math.abs(Math.cos(radians)) + height * Math.sin(radians)) /
          2;
        const halfHeight =
          (height * Math.abs(Math.cos(radians)) + width * Math.sin(radians)) /
          2;
        const x = radius * Math.sin(radians);
        const y = radius * (1 - Math.cos(radians));
        if (
          x - halfWidth > view.width / 2 + 24 ||
          y - halfHeight > view.bottom - centreY + 24
        )
          break;
      }
      gsap.set(phones, { transformOrigin: `50% ${height / 2 + radius}px` });
      element.dataset.orbitRadius = radius.toFixed(2);
      element.dataset.orbitAngle = String(angle);
      element.dataset.orbitCentreY = String(phoneTop + height / 2 + radius);
    };

    const play = (index: number) => {
      // An in-flight pair completes naturally. Its completion reads the latest
      // request, so rapid selections never create extra phones or lose a click.
      if (transition) return;
      if (!enabled || !visible || index === current) {
        settle(index);
        return;
      }
      measure();
      const outgoing = phones[current];
      const incoming = phones[index];
      gsap.set(outgoing, { rotation: 0, autoAlpha: 1 });
      gsap.set(incoming, { rotation: -angle, autoAlpha: 1 });
      outgoing.dataset.orbitState = "leaving";
      incoming.dataset.orbitState = "entering";
      element.dataset.orbitMoving = "true";
      setMoving(true);
      transition = gsap
        .timeline({
          defaults: { duration: TRANSITION_DURATION, ease: "power2.inOut" },
          onComplete: () => {
            settle(index);
            if (requestedRef.current !== index)
              selectRef.current(requestedRef.current);
          },
        })
        .to(outgoing, { rotation: angle }, 0)
        .to(incoming, { rotation: 0 }, 0);
    };

    // Keep only the initial styles in the context. Completed carousel cycles
    // must not accumulate there during a long visit; the active timeline is
    // explicitly killed on cleanup.
    selectRef.current = (index) => context.ignore(() => play(index));
    context.add(() => {
      measure();
      settle(current);
    });
    const resize = new ResizeObserver(() => context.ignore(measure));
    resize.observe(panel);
    resize.observe(viewport);

    // Local QA can hold real transitions at exact points through visible
    // review controls. This listener is absent from normal production builds.
    const preview = (event: Event) => {
      const progress = (event as CustomEvent<number>).detail;
      if (!transition) select((current + 1) % screens.length);
      transition?.pause().progress(progress);
    };
    if (review) element.addEventListener("orbit-preview", preview);
    return () => {
      resize.disconnect();
      element.removeEventListener("orbit-preview", preview);
      transition?.kill();
      context.revert();
      selectRef.current = () => {};
    };
  }, [enabled, visible, review, select]);

  useEffect(() => {
    if (
      !enabled ||
      !visible ||
      interacting ||
      moving ||
      !ready[screens[requested]] ||
      !ready[screens[next]]
    )
      return;
    const timer = gsap.delayedCall(AUTOPLAY_DELAY, () => select(next));
    return () => {
      timer.kill();
    };
  }, [enabled, visible, interacting, moving, ready, requested, next, select]);

  return (
    <div
      ref={root}
      className="product-device product-device--orbit"
      data-cycle-transition="orbit"
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setInteracting(false);
      }}
    >
      <div className="device-orbit-viewport">
        {screens.map((screen, index) => (
          <div
            key={screen}
            className="device-orbit-handset"
            data-orbit-screen={screen}
            aria-hidden={index !== requested}
          >
            <div className="device-frame">
              <div className="device-screen">
                <ProgressiveImage
                  asset={screen}
                  alt={appScreens[screen].alt}
                  sizes="(max-width: 640px) 210px, 220px"
                  load={
                    visible &&
                    (index === requested ||
                      (enabled &&
                        ready[screens[requested]] === true &&
                        index === next))
                  }
                  onReady={markReady}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="device-navigation">
        <p className="device-controls-label">Explore the app</p>
        <div
          className="device-controls"
          role="group"
          aria-label="Product screens"
        >
          {screens.map((screen, index) => (
            <button
              key={screen}
              type="button"
              onClick={() => select(index)}
              aria-pressed={requested === index}
            >
              {appScreens[screen].name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
