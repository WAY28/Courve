import { formatCompactRupiah, niceCeil } from "@/lib/format";
import { formatPrice, type Granularity, type SalesReport } from "@/lib/api";

const W = 720;
const H = 250;
const M = { top: 16, right: 12, bottom: 32, left: 62 };
const TZ = "Asia/Jakarta";

const fmt = (iso: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("id-ID", { timeZone: TZ, ...options }).format(new Date(iso));

/** Short label under a bar. */
function axisLabel(iso: string, granularity: Granularity) {
  switch (granularity) {
    case "hour":
      return fmt(iso, { hour: "2-digit", minute: "2-digit", hour12: false });
    case "month":
      return fmt(iso, { month: "short", year: "2-digit" });
    default:
      return fmt(iso, { day: "numeric", month: "short" });
  }
}

/** Full description used in tooltips and the accessible table. */
export function bucketTitle(iso: string, granularity: Granularity) {
  switch (granularity) {
    case "hour":
      return fmt(iso, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });
    case "day":
      return fmt(iso, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    case "week": {
      const end = new Date(new Date(iso).getTime() + 6 * 86_400_000).toISOString();
      return `${fmt(iso, { day: "numeric", month: "short" })} – ${fmt(end, { day: "numeric", month: "short", year: "numeric" })}`;
    }
    case "month":
      return fmt(iso, { month: "long", year: "numeric" });
  }
}

const periodWord: Record<Granularity, string> = {
  hour: "per jam",
  day: "per hari",
  week: "per minggu",
  month: "per bulan",
};

export default function RevenueChart({
  buckets,
  granularity,
  rangeLabel,
}: {
  buckets: SalesReport["buckets"];
  granularity: Granularity;
  rangeLabel: string;
}) {
  const total = buckets.reduce((s, b) => s + b.revenue, 0);
  const peak = Math.max(...buckets.map((b) => b.revenue), 0);
  const max = peak > 0 ? niceCeil(peak) : 100_000;
  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;
  const slot = plotW / buckets.length;
  const barW = Math.min(slot * 0.64, 44);
  const y = (v: number) => M.top + plotH - (v / max) * plotH;
  const ticks = [0, max / 2, max];
  // Keep labels from overlapping: roughly 8-12 labels across the axis.
  const every = buckets.length > 24 ? 3 : buckets.length > 12 ? 2 : 1;
  const last = buckets.length - 1;

  return (
    <figure>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Grafik batang pendapatan ${periodWord[granularity]} untuk ${rangeLabel} terakhir. Total ${formatPrice(total)}.`}
        className="h-auto w-full"
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth="1" />
            <text x={M.left - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">
              {formatCompactRupiah(t)}
            </text>
          </g>
        ))}
        {peak === 0 && (
          <text x={M.left + plotW / 2} y={M.top + plotH / 2} textAnchor="middle" fontSize="13" fill="var(--muted)">
            Belum ada penjualan pada periode ini
          </text>
        )}
        {buckets.map((b, i) => {
          const x = M.left + i * slot + (slot - barW) / 2;
          const h = Math.max(b.revenue > 0 ? 2 : 0, (b.revenue / max) * plotH);
          const isCurrent = i === last;
          const showLabel = (last - i) % every === 0;
          return (
            <g key={b.start}>
              <rect
                x={x}
                y={M.top + plotH - h}
                width={barW}
                height={h}
                rx="3"
                fill={isCurrent ? "var(--accent-hover)" : "var(--lavender)"}
              >
                <title>{`${bucketTitle(b.start, granularity)}: ${formatPrice(b.revenue)} (${b.orders} pesanan)`}</title>
              </rect>
              {showLabel && (
                <text x={x + barW / 2} y={H - 10} textAnchor="middle" fontSize="11" fill="var(--muted)">
                  {axisLabel(b.start, granularity)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <table className="sr-only">
        <caption>
          Pendapatan {periodWord[granularity]}, {rangeLabel} terakhir
        </caption>
        <thead>
          <tr>
            <th scope="col">Periode</th>
            <th scope="col">Pendapatan</th>
            <th scope="col">Pesanan</th>
          </tr>
        </thead>
        <tbody>
          {buckets.map((b) => (
            <tr key={b.start}>
              <td>{bucketTitle(b.start, granularity)}</td>
              <td>{formatPrice(b.revenue)}</td>
              <td>{b.orders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
