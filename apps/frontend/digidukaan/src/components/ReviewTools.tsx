"use client";
// Local review instrumentation. The production build excludes this component.
// The report is exposed in the page so browser review uses the same visible UI.
import { useEffect, useRef, useState } from "react";
export function ReviewTools() {
  const [report, setReport] = useState("");
  const [running, setRunning] = useState(false);
  const metrics = useRef({ lcpMs: 0, cls: 0 });
  const heroMotion = useRef<
    {
      time: number;
      transform: string;
      screen: string | null;
      ready: string | null;
      scroll: string;
    }[]
  >([]);
  useEffect(() => {
    const phone = document.querySelector<HTMLElement>(".hero-phone");
    if (!phone) return;
    const observer = new MutationObserver((records) => {
      if (
        !records.some(
          ({ target, attributeName }) =>
            target instanceof Element &&
            (target.matches(".device-spin") || attributeName === "data-active"),
        )
      )
        return;
      const screen = phone.querySelector(
        '.device-slide[data-active="true"] [data-image]',
      );
      heroMotion.current.push({
        time: performance.now(),
        transform:
          phone.querySelector<HTMLElement>(".device-spin")?.style.transform ||
          "none",
        screen: screen?.getAttribute("data-image") || null,
        ready: screen?.getAttribute("data-image-state") || null,
        scroll: phone.style.transform,
      });
      if (heroMotion.current.length > 180) heroMotion.current.shift();
    });
    observer.observe(phone, {
      attributes: true,
      subtree: true,
      attributeFilter: ["style", "data-active"],
    });
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const lcp = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      metrics.current.lcpMs = entries.at(-1)?.startTime || 0;
    });
    const cls = new PerformanceObserver((list) => {
      for (const entry of list.getEntries())
        if (
          !(entry as PerformanceEntry & { hadRecentInput: boolean })
            .hadRecentInput
        )
          metrics.current.cls += (
            entry as PerformanceEntry & { value: number }
          ).value;
    });
    lcp.observe({ type: "largest-contentful-paint", buffered: true });
    cls.observe({ type: "layout-shift", buffered: true });
    return () => {
      lcp.disconnect();
      cls.disconnect();
    };
  }, []);
  const run = async () => {
    setRunning(true);
    const { default: axe } = await import("axe-core");
    const result = await axe.run({ exclude: [".review-tools"] });
    const visible = (el: Element) => {
      const box = el.getBoundingClientRect();
      return (
        box.width > 0 &&
        box.height > 0 &&
        getComputedStyle(el).visibility !== "hidden"
      );
    };
    const route = document.querySelector<SVGPathElement>("[data-route-track]");
    const routeMatrix = route?.getScreenCTM();
    const routeLength = route?.getTotalLength() ?? 0;
    const routeStart = Number(route?.dataset.routeStart ?? 0);
    const routeEnd = Number(route?.dataset.routeEnd ?? routeLength);
    const routeOccluders = Array.from(
      document.querySelectorAll(
        ".hero-phone .device-frame,.hero-phone .device-back,.route-tag",
      ),
    );
    const blockedRoutePhases: number[] = [];
    if (route && routeMatrix) {
      const blocked = (phase: number) => {
        const point = route
          .getPointAtLength(routeStart + phase * (routeEnd - routeStart))
          .matrixTransform(routeMatrix);
        if (
          point.x < 22 ||
          point.x > innerWidth - 22 ||
          point.y < 22 ||
          point.y > innerHeight - 22
        )
          return true;
        return document
          .elementsFromPoint(point.x, point.y)
          .some((element) =>
            routeOccluders.some((occluder) => occluder.contains(element)),
          );
      };
      const occluded = Array.from({ length: 1000 }, (_, index) =>
        blocked(index / 1000),
      );
      for (let sample = 0; sample < 1000; sample++) {
        const phase = sample / 1000;
        if (occluded[sample] && occluded[(sample + 500) % 1000])
          blockedRoutePhases.push(phase);
      }
    }
    const orbit = document.querySelector<HTMLElement>(".product-device--orbit");
    const data = {
      url: location.href,
      viewport: { width: innerWidth, height: innerHeight },
      timings: {
        ...metrics.current,
        environment:
          "Unthrottled local Chromium preview; not a mobile field benchmark.",
      },
      heroMotion: heroMotion.current,
      heroRoute: {
        arrowCount: document.querySelectorAll("[data-route-parcel]").length,
        routeStart,
        routeEnd,
        blockedRoutePhases,
        phoneTransform:
          document.querySelector<HTMLElement>(".hero-phone")?.style.transform,
        spinTransform:
          document.querySelector<HTMLElement>(".device-spin")?.style.transform,
      },
      productOrbit: orbit
        ? {
            radius: orbit.dataset.orbitRadius,
            angle: orbit.dataset.orbitAngle,
            moving: orbit.dataset.orbitMoving,
            centreY: orbit.dataset.orbitCentreY,
            frames: Array.from(
              orbit.querySelectorAll<HTMLElement>(".device-orbit-handset"),
            ).map((phone) => ({
              screen: phone.dataset.orbitScreen,
              state: phone.dataset.orbitState,
              transform: getComputedStyle(phone).transform,
              visibility: getComputedStyle(phone).visibility,
              bounds: phone.getBoundingClientRect().toJSON(),
            })),
          }
        : null,
      title: document.title,
      description: document
        .querySelector("meta[name=description]")
        ?.getAttribute("content"),
      canonical: document
        .querySelector("link[rel=canonical]")
        ?.getAttribute("href"),
      headings: [...document.querySelectorAll("h1,h2,h3")]
        .filter(visible)
        .map((el) => ({ tag: el.tagName, text: el.textContent })),
      overflowX: document.documentElement.scrollWidth > innerWidth,
      images: [...document.images].filter(visible).map((img) => ({
        src: img.currentSrc,
        loaded: img.complete && img.naturalWidth > 0,
        alt: img.alt,
      })),
      smallTargets: [...document.querySelectorAll("a,button,summary")]
        .filter(visible)
        .filter((el) => {
          const box = el.getBoundingClientRect();
          return box.width < 24 || box.height < 24;
        })
        .map((el) => el.textContent),
      a11y: {
        violations: result.violations.map((item) => ({
          id: item.id,
          impact: item.impact,
          description: item.description,
          nodes: item.nodes.map((node) => ({
            target: node.target,
            summary: node.failureSummary,
          })),
        })),
        passes: result.passes.length,
        incomplete: result.incomplete.map((item) => ({
          id: item.id,
          nodes: item.nodes.map((node) => node.target),
        })),
      },
    };
    setReport(JSON.stringify(data, null, 2));
    setRunning(false);
  };
  return (
    <details
      className="review-tools"
      style={{
        position: "fixed",
        left: 12,
        bottom: 48,
        zIndex: 100,
        maxHeight: "40vh",
        maxWidth: 360,
        overflow: "auto",
        padding: 12,
        background: "#FAF9F5",
        border: "1px solid currentColor",
      }}
    >
      <summary>Local review tools</summary>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[0.25, 0.5, 0.75, 1].map((progress) => (
          <button
            key={progress}
            style={{ padding: 10, border: "1px solid currentColor" }}
            onClick={() =>
              document
                .querySelector(".product-device--orbit")
                ?.dispatchEvent(
                  new CustomEvent("orbit-preview", { detail: progress }),
                )
            }
          >
            {progress === 1 ? "Finish orbit" : `Orbit ${progress * 100}%`}
          </button>
        ))}
      </div>
      <button
        onClick={run}
        disabled={running}
        style={{
          padding: 16,
          border: "1px solid currentColor",
          marginBlock: 16,
        }}
      >
        {running ? "Reviewing…" : "Run page review"}
      </button>
      <pre
        style={{
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          fontSize: 12,
        }}
        aria-live="polite"
      >
        {report}
      </pre>
    </details>
  );
}
