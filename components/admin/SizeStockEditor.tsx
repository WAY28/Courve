"use client";

export type SizeRow = { size: string; stock: string };

export default function SizeStockEditor({
  rows,
  onChange,
}: {
  rows: SizeRow[];
  onChange: (rows: SizeRow[]) => void;
}) {
  const update = (i: number, patch: Partial<SizeRow>) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const total = rows.reduce((n, r) => n + (Number(r.stock) || 0), 0);

  return (
    <fieldset>
      <legend className="label">Ukuran &amp; stok</legend>
      <div className="flex flex-col gap-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-end gap-2">
            <div className="w-24">
              <label htmlFor={`size-${i}`} className="mb-1 block text-xs text-muted">
                Ukuran
              </label>
              <input
                id={`size-${i}`}
                required
                maxLength={10}
                value={row.size}
                onChange={(e) => update(i, { size: e.target.value.toUpperCase() })}
                placeholder="M"
                className="field h-11"
              />
            </div>
            <div className="flex-1">
              <label htmlFor={`stock-${i}`} className="mb-1 block text-xs text-muted">
                Stok
              </label>
              <input
                id={`stock-${i}`}
                required
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={row.stock}
                onChange={(e) => update(i, { stock: e.target.value })}
                className="field h-11"
              />
            </div>
            <button
              type="button"
              onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
              disabled={rows.length <= 1}
              aria-label={`Hapus ukuran ${row.size || i + 1}`}
              className="h-11 rounded-xl border border-border px-3 text-sm text-muted hover:border-secondary hover:text-secondary-dark disabled:opacity-40"
            >
              Hapus
            </button>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onChange([...rows, { size: "", stock: "0" }])}
          className="text-sm font-semibold text-accent-dark hover:underline"
        >
          + Tambah ukuran
        </button>
        <span className="text-xs text-muted">Total stok: {total}</span>
      </div>
    </fieldset>
  );
}
