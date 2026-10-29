import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMotion } from "./motion-context";

export function usePageMotion(root: RefObject<HTMLDivElement | null>) {
  const enabled = useMotion();
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const scope = root.current;
    if (!scope) return;
    let disposed = false;
    let phase = 0;
    let visible = true;
    let journeyMedia: ReturnType<typeof gsap.matchMedia> | undefined;
    const track = scope.querySelector<SVGPathElement>("[data-route-track]");
    const parcels = Array.from(
      scope.querySelectorAll<SVGGElement>("[data-route-parcel]"),
    );
    let length = track?.getTotalLength() ?? 0;
    let routeStart = 0;
    let routeEnd = length;
    const measureRoute = () => {
      if (!track) return;
      const mobile = window.matchMedia("(max-width: 640px)").matches;
      const compact = window.matchMedia("(max-width: 1100px)").matches;
      scope
        .querySelectorAll<SVGCircleElement>("[data-route-node]")
        .forEach((node) => {
          const x = mobile
            ? node.dataset.mobileX
            : compact
              ? node.dataset.compactX
              : node.dataset.routeNode;
          if (x) node.setAttribute("cx", x);
        });
      scope
        .querySelectorAll<SVGPathElement>("[data-route-mobile]")
        .forEach((path) => {
          const shape = mobile
            ? path.dataset.routeMobile
            : compact
              ? path.dataset.routeCompact
              : path.dataset.routeDesktop;
          if (shape && path.getAttribute("d") !== shape)
            path.setAttribute("d", shape);
        });
      length = track?.getTotalLength() ?? 0;
      const matrix = track?.getScreenCTM();
      if (!track || !matrix) return;
      // The drawn rail extends beyond the viewport. Keep both travellers on
      // its visible portion, with room for their complete arrow badges.
      const inset = Math.max(24, 22 * Math.abs(matrix.a));
      const distances = Array.from(
        { length: 201 },
        (_, index) => (index * length) / 200,
      ).filter((distance) => {
        const point = track.getPointAtLength(distance).matrixTransform(matrix);
        return point.x >= inset && point.x <= window.innerWidth - inset;
      });
      routeStart = distances[0] ?? 0;
      routeEnd = distances.at(-1) ?? length;
      track.dataset.routeStart = String(routeStart);
      track.dataset.routeEnd = String(routeEnd);
    };
    const placeParcels = () => {
      if (!track) return;
      for (const parcel of parcels) {
        const offset = Number(parcel.dataset.routeOffset ?? 0);
        const point = track.getPointAtLength(
          routeStart + ((0.32 + phase + offset) % 1) * (routeEnd - routeStart),
        );
        parcel.setAttribute("transform", `translate(${point.x} ${point.y})`);
      }
    };
    const tick = (_seconds: number, delta: number) => {
      if (!visible || !track || !parcels.length) return;
      phase += Math.min(delta, 50) / 19000;
      placeParcels();
    };
    const context = gsap.context(() => {
      measureRoute();
      placeParcels();
      if (!enabled) return;
      gsap.ticker.add(tick);
      // Reproducible setup also works in React development Strict Mode.
      if (scope.querySelector("[data-intro]"))
        gsap.from("[data-intro]", {
          y: 24,
          duration: 0.8,
          stagger: 0.06,
          ease: "power3.out",
          clearProps: "transform",
        });
      gsap.utils
        .toArray<HTMLElement>("[data-reveal]", scope)
        .forEach((element) => {
          gsap.from(element, {
            y: 24,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: { trigger: element, start: "top 94%", once: true },
            clearProps: "transform",
          });
        });
      if (track) {
        ScrollTrigger.create({
          trigger: ".hero",
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => {
            visible = self.isActive;
          },
        });
        gsap.to("[data-hero-phone]", {
          y: -25,
          rotate: 3,
          ease: "none",
          scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: 0.8,
          },
        });
      }
      const journey = scope.querySelector<HTMLElement>(".journey-flow");
      if (journey) {
        journeyMedia = gsap.matchMedia();
        journeyMedia.add(
          { mobile: "(max-width: 640px)", desktop: "(min-width: 641px)" },
          (match) => {
            const mobile = Boolean(match.conditions?.mobile);
            const rail = journey.querySelector<HTMLElement>(".journey-track")!;
            const progress = journey.querySelector<HTMLElement>(
              "[data-journey-progress]",
            )!;
            const traveller = journey.querySelector<HTMLElement>(
              "[data-journey-traveller]",
            )!;
            const steps = Array.from(
              journey.querySelectorAll<HTMLElement>("[data-step]"),
            );
            const highlights = steps.map((step) =>
              step.querySelector<HTMLElement>("[data-journey-highlight]")!,
            );
            const artworks = steps.map((step) =>
              step.querySelector<HTMLElement>("[data-journey-art]")!,
            );
            const axis = mobile ? "y" : "x";
            const scale = mobile ? "scaleY" : "scaleX";
            const duration = 7.2;
            gsap.set(traveller, { x: 0, y: 0, rotation: mobile ? 90 : 0 });
            const sequence = gsap.timeline({
              repeat: -1,
              repeatDelay: 0.65,
              paused: true,
            });
            const buildSequence = () => {
              const time = sequence.time();
              const distance = mobile ? rail.clientHeight : rail.clientWidth;
              sequence.clear().time(0);
              sequence
                .fromTo(
                  progress,
                  { [scale]: 0, opacity: 1 },
                  { [scale]: 1, duration, ease: "none" },
                  0,
                )
                .fromTo(
                  traveller,
                  { [axis]: 0 },
                  { [axis]: distance, duration, ease: "none" },
                  0,
                )
                .fromTo(
                  traveller,
                  { opacity: 0 },
                  { opacity: 1, duration: 0.25 },
                  0,
                );
              // Layout offsets ignore the animated scale. Measure once per refresh,
              // so each stage follows the same line position on desktop and mobile.
              steps.forEach((step, index) => {
                const offset = mobile
                  ? step.offsetTop + 40 - rail.offsetTop
                  : step.offsetLeft + 28;
                const at =
                  gsap.utils.clamp(0, 1, offset / Math.max(distance, 1)) *
                  duration;
                sequence
                  .fromTo(
                    step,
                    { scale: 1 },
                    {
                      scale: mobile ? 1.035 : 1.045,
                      duration: 0.55,
                      ease: "power3.out",
                    },
                    at,
                  )
                  .fromTo(
                    artworks[index],
                    { y: 0 },
                    { y: mobile ? -3 : -6, duration: 0.55, ease: "power3.out" },
                    at,
                  )
                  .fromTo(
                    highlights[index],
                    { scaleX: 0, opacity: 0 },
                    {
                      scaleX: 1,
                      opacity: 1,
                      duration: 0.55,
                      ease: "power3.out",
                    },
                    at,
                  );
              });
              // Keep visited stages emphasized until the line completes its pass.
              sequence
                .to(
                  steps,
                  { scale: 1, duration: 0.65, ease: "power3.inOut" },
                  duration + 0.2,
                )
                .to(
                  artworks,
                  { y: 0, duration: 0.65, ease: "power3.inOut" },
                  duration + 0.2,
                )
                .to(highlights, { opacity: 0, duration: 0.4 }, duration + 0.2)
                .to(
                  [traveller, progress],
                  { opacity: 0, duration: 0.4 },
                  duration + 0.35,
                )
                .time(Math.min(time, sequence.duration()), true);
            };
            buildSequence();
            const visibility = ScrollTrigger.create({
              trigger: journey,
              start: "top bottom",
              end: "bottom top",
              onToggle: (self) => sequence.paused(!self.isActive),
              onRefresh: buildSequence,
            });
            sequence.paused(!visibility.isActive);
          },
        );
      }
      const journeyCta = scope.querySelector<HTMLElement>(".journey-cta");
      const shimmer = journeyCta?.querySelector<HTMLElement>(
        "[data-journey-shimmer]",
      );
      if (journeyCta && shimmer) {
        const shine = gsap.timeline({
          paused: true,
          repeat: -1,
          repeatDelay: 3.2,
        });
        shine
          .set(shimmer, { opacity: 1 })
          .fromTo(
            shimmer,
            { xPercent: -120 },
            { xPercent: 250, duration: 1.4, ease: "power3.inOut" },
          )
          .set(shimmer, { opacity: 0 });
        const visibility = ScrollTrigger.create({
          trigger: journeyCta,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => shine.paused(!self.isActive),
        });
        shine.paused(!visibility.isActive);
      }
    }, scope);
    const refresh = () => {
      if (!disposed) {
        measureRoute();
        placeParcels();
        ScrollTrigger.refresh();
      }
    };
    const observer = new ResizeObserver(refresh);
    observer.observe(scope);
    document.fonts.ready.then(refresh);
    refresh();
    return () => {
      disposed = true;
      observer.disconnect();
      gsap.ticker.remove(tick);
      journeyMedia?.revert();
      context.revert();
    };
  }, [root, enabled]);
}
