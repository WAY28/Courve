export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6" aria-busy="true" aria-label="Memuat produk">
      <div className="skeleton h-4 w-56" />
      <div className="mt-6 grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
        <div className="skeleton aspect-[4/5] w-full" />
        <div className="flex flex-col gap-4">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-10 w-4/5" />
          <div className="skeleton h-5 w-32" />
          <div className="skeleton h-9 w-48" />
          <div className="skeleton h-24 w-full" />
          <div className="skeleton h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
