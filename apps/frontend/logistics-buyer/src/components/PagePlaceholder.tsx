export default function PagePlaceholder({ title }: { title: string }) {
  return (
    <div className="p-4">
      <h3>{title}</h3>
      <p className="text-muted">This screen is being built.</p>
    </div>
  );
}
