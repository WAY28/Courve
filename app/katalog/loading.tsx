export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6" aria-busy="true" aria-label="Memuat katalog">
      <div className="skeleton h-4 w-32" />
      <div className="skeleton mt-6 h-10 w-64" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <div className="skeleton hidden h-80 lg:block" />
        <div className="grid grid-cols-2 gap-4 lg:gap-6 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton aspect-[3/4]" />
          ))}
        </div>
      </div>
    </div>
  );
}
