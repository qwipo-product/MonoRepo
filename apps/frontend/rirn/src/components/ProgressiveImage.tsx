// Pre-encoded files avoid on-demand conversion; previews need no request.
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import assets from "../data/image-assets.json";

export type ImageAsset = keyof typeof assets;

export function ProgressiveImage({
  asset,
  alt,
  sizes,
  priority = false,
  load,
  className = "",
  onReady,
}: {
  asset: ImageAsset;
  alt: string;
  sizes: string;
  priority?: boolean;
  /** Omit for viewport loading; devices request only their selected screen. */
  load?: boolean;
  className?: string;
  onReady?: (asset: ImageAsset) => void;
}) {
  const image = assets[asset];
  const svg = "svg" in image ? image.svg : undefined;
  const root = useRef<HTMLSpanElement>(null);
  const full = useRef<HTMLImageElement>(null);
  const [started, setStarted] = useState(priority || load === true);
  const [state, setState] = useState<"preview" | "ready" | "error">("preview");
  const [rasterOnly, setRasterOnly] = useState(false);
  const fail = useCallback(() => {
    // Keep the embedded preview visible if an SVG cannot render. The existing
    // responsive AVIF/WebP set is a separate, bounded fallback request.
    if (svg && !rasterOnly) setRasterOnly(true);
    else setState("error");
  }, [svg, rasterOnly]);

  // Remember a request when its carousel slide moves out of view. Changing
  // slides must not cancel the download or replace an already decoded image.
  if (load === true && !started) setStarted(true);

  useEffect(() => {
    if (started || load !== undefined) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, [started, load]);

  const reveal = useCallback(
    async (element: HTMLImageElement) => {
      try {
        await element.decode();
        // Ignore a completed request belonging to an unmounted image.
        if (full.current !== element || !element.naturalWidth) return;
        setState("ready");
        onReady?.(asset);
      } catch {
        if (full.current === element) fail();
      }
    },
    [asset, onReady, fail],
  );

  useEffect(() => {
    // A cache hit may finish before React attaches onLoad during hydration.
    if (full.current?.complete) {
      void reveal(full.current);
    }
  }, [started, reveal]);

  const srcSet = (format: "webp" | "avif") =>
    image.variants
      .map((variant) => `${variant[format]} ${variant.width}w`)
      .join(", ");

  return (
    <span
      ref={root}
      className={`progressive-image ${className}`}
      data-image={asset}
      data-image-state={state}
      role="img"
      aria-label={alt}
      style={
        {
          "--image-aspect-ratio": `${image.width} / ${image.height}`,
        } as CSSProperties
      }
    >
      <img
        className="image-preview"
        src={image.preview}
        width={image.width}
        height={image.height}
        alt=""
        aria-hidden="true"
      />
      {started && (
        <picture className="image-full">
          {svg && !rasterOnly && (
            <source type="image/svg+xml" srcSet={svg} />
          )}
          <source type="image/avif" srcSet={srcSet("avif")} sizes={sizes} />
          <img
            ref={full}
            src={image.variants[0].webp}
            srcSet={srcSet("webp")}
            sizes={sizes}
            width={image.width}
            height={image.height}
            alt=""
            decoding="async"
            loading="eager"
            fetchPriority={priority ? "high" : "auto"}
            onLoad={(event) => void reveal(event.currentTarget)}
            onError={fail}
          />
        </picture>
      )}
    </span>
  );
}
