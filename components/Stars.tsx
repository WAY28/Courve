export default function Stars({
  rating,
  reviews,
  size = "sm",
}: {
  rating: number;
  reviews: number;
  size?: "sm" | "md";
}) {
  if (reviews <= 0) {
    return <div className={`text-muted ${size === "md" ? "text-sm" : "text-xs"}`}>Belum ada ulasan</div>;
  }
  const rounded = Math.round(rating);
  return (
    <div
      className={`flex items-center gap-1.5 ${size === "md" ? "text-sm" : "text-xs"}`}
      role="img"
      aria-label={`Rating ${rating.toFixed(1)} dari 5, ${reviews} ulasan`}
    >
      <span className="tracking-tight text-gold" aria-hidden="true">
        {"★".repeat(rounded)}
        <span className="text-border">{"★".repeat(5 - rounded)}</span>
      </span>
      <span className="font-medium text-foreground" aria-hidden="true">
        {rating.toFixed(1)}
      </span>
      <span className="text-muted" aria-hidden="true">
        ({reviews})
      </span>
    </div>
  );
}
