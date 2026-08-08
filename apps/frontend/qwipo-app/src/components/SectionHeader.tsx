/* Section title with an optional "See all" link. Used by every home rail. */
export default function SectionHeader({
  title,
  onSeeAll,
  seeAllLabel = 'See all',
}: {
  title: string;
  onSeeAll?: () => void;
  seeAllLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between px-4">
      <h2 className="text-base font-semibold">{title}</h2>
      {onSeeAll && (
        <button onClick={onSeeAll} className="text-sm font-medium text-primary">
          {seeAllLabel}
        </button>
      )}
    </div>
  );
}
