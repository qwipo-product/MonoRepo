/* Loading — what a page looks like while it is still arriving.

   Two things at once. Behind, the shape of the page being fetched, drawn in
   grey: the buyer can already see a header, a search row and a list of product
   cards, so when the real thing lands nothing jumps. In front, the unboxing
   mark, centred, saying the wait is ours rather than the connection's.

   The skeleton is modelled on the Product List because that is the page a
   buyer waits for most; it is a backdrop, not a copy, so it stays blocks. */

/** One grey block. Everything in the skeleton is made of these. */
function Bar({ className }: { className: string }) {
  return <div className={`rounded bg-muted ${className}`} />;
}

function CardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex gap-3">
        <div className="h-24 w-24 shrink-0 rounded-lg bg-muted" />
        <div className="min-w-0 flex-1">
          <Bar className="h-3.5 w-full" />
          <Bar className="mt-2 h-3.5 w-4/5" />
          <Bar className="mt-3 h-3 w-24" />
          <div className="mt-3 flex gap-2">
            <Bar className="h-6 w-20 rounded-full" />
            <Bar className="h-6 w-20 rounded-full" />
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <Bar className="h-5 w-24 rounded-md" />
        <Bar className="h-6 w-20" />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <Bar className="h-10 w-28 rounded-md" />
        <Bar className="h-10 w-22 rounded-md" />
      </div>
    </div>
  );
}

export function LoadingScreen() {
  return (
    <div className="relative h-full overflow-hidden bg-background-subtle">
      {/* the page, still on its way */}
      <div className="h-full animate-pulse" aria-hidden>
        <div className="border-b border-border bg-card px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 shrink-0 rounded-md bg-muted" />
            <div className="min-w-0 flex-1">
              <Bar className="h-4 w-40" />
              <Bar className="mt-1.5 h-3 w-28" />
            </div>
            <div className="h-9 w-9 shrink-0 rounded-md bg-muted" />
            <div className="h-9 w-9 shrink-0 rounded-md bg-muted" />
          </div>
        </div>
        <div className="space-y-3 p-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>

      {/* and the wait itself, over the top of it. The scrim is light: the
          skeleton is the point — it tells the buyer what is coming — so it
          should still read as a page, not be washed out behind the mark. */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/35">
        {/* The mark is black line art on a transparent ground, so in dark mode
            it is inverted to read as white. The hue rotation puts the colour
            back: inverting alone turned the label from amber to blue, while
            leaving the black and white exactly where the inversion put them. */}
        <img
          src="/loading/unboxing.gif"
          alt="Loading"
          className="h-28 w-28 dark:hue-rotate-180 dark:invert"
        />
      </div>
    </div>
  );
}
