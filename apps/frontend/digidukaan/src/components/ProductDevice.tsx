"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useMotion } from "../lib/motion-context";
import { ProgressiveImage, type ImageAsset } from "./ProgressiveImage";

import { appScreens, type AppScreen } from "../data/app-screens";

export function ProductDevice({
  screens,
  active,
  controls = false,
  priority = false,
  cycleTransition = "fade",
}: {
  screens: AppScreen[];
  active?: number;
  controls?: boolean;
  priority?: boolean;
  cycleTransition?: "fade" | "spin";
}) {
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [ready, setReady] = useState<Partial<Record<ImageAsset, boolean>>>({});
  const markReady = useCallback((screen: ImageAsset) => {
    setReady((previous) =>
      previous[screen] ? previous : { ...previous, [screen]: true },
    );
  }, []);
  const root = useRef<HTMLDivElement>(null);
  const spinContext = useRef<gsap.Context | null>(null);
  const settledTilt = useRef(0);
  const enabled = useMotion();
  const selected = active ?? current;
  const count = screens.length;
  const nextScreen = (selected + 1) % count;
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.15 },
    );
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (
      !enabled ||
      !visible ||
      interacting ||
      !ready[screens[selected]] ||
      (cycleTransition === "spin" && !ready[screens[nextScreen]]) ||
      active !== undefined ||
      count < 2
    )
      return;
    const next = gsap.delayedCall(5, () => {
      if (cycleTransition !== "spin" || !root.current) {
        setCurrent(nextScreen);
        return;
      }
      // The spin owns an inner wrapper; scroll and idle motion keep their
      // existing transforms. Swap screens only while the front is hidden.
      spinContext.current?.revert();
      const phone = root.current.closest<HTMLElement>("[data-hero-phone]");
      const scrollTilt = phone
        ? Number(gsap.getProperty(phone, "rotation"))
        : 0;
      const fromTilt = settledTilt.current;
      // Mirror the composed angle: outer + inner becomes -(outer + inner).
      // Only the inner layer changes; the scroll transform keeps its own path.
      const toTilt = -2 * scrollTilt - fromTilt;
      spinContext.current = gsap.context(() => {
        gsap
          .timeline()
          .fromTo(
            ".device-spin",
            { rotationY: 0, rotation: fromTilt },
            {
              rotationY: 360,
              rotation: toTilt,
              duration: 0.8,
              ease: "power3.inOut",
            },
          )
          .call(
            () => {
              settledTilt.current = toTilt;
              setCurrent(nextScreen);
            },
            undefined,
            0.4,
          )
          .set(".device-spin", { rotationY: 0 });
      }, root);
    });
    return () => {
      next.kill();
    };
  }, [
    enabled,
    visible,
    interacting,
    active,
    count,
    current,
    ready,
    screens,
    selected,
    cycleTransition,
    nextScreen,
  ]);
  useEffect(() => {
    // Stop cleanly on pause, when off screen, and on navigation. The currently
    // displayed image remains readable even if a spin is interrupted.
    const spin = root.current?.querySelector(".device-spin");
    return () => {
      spinContext.current?.revert();
      spinContext.current = null;
      if (spin) gsap.set(spin, { rotationY: 0, rotation: settledTilt.current });
    };
  }, [enabled, visible]);
  useEffect(() => {
    if (!enabled || !visible || !root.current) return;
    const context = gsap.context(() => {
      gsap.fromTo(
        ".device-float",
        { y: 0, rotateY: -3 },
        {
          y: -9,
          rotateY: 3,
          duration: 3.8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        },
      );
    }, root);
    return () => context.revert();
  }, [enabled, visible]);
  const frame = (
    <div className="device-frame">
      <div className="device-screen">
        {screens.map((screen, index) => (
          <div
            key={screen}
            className="device-slide"
            data-active={index === selected}
            aria-hidden={index !== selected}
          >
            <ProgressiveImage
              asset={screen}
              alt={appScreens[screen].alt}
              sizes="(max-width: 640px) 200px, 280px"
              priority={priority && index === 0}
              load={
                (visible || priority) &&
                (index === selected ||
                  (cycleTransition === "spin" &&
                    enabled &&
                    visible &&
                    ready[screens[selected]] === true &&
                    index === nextScreen))
              }
              onReady={markReady}
            />
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div
      ref={root}
      className="product-device"
      data-cycle-transition={cycleTransition}
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setInteracting(false);
      }}
    >
      <div className="device-float">
        {cycleTransition === "spin" ? (
          <div className="device-spin">
            {frame}
            <div className="device-back" aria-hidden="true">
              <span className="device-camera" />
              <span className="device-back-brand">DigiDukaan</span>
            </div>
          </div>
        ) : (
          frame
        )}
      </div>
      {controls && (
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
                onClick={() => setCurrent(index)}
                aria-pressed={selected === index}
              >
                {appScreens[screen].name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
