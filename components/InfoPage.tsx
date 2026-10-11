import type { ReactNode } from "react";

export default function InfoPage({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="font-display mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      <div className="mt-8 flex flex-col gap-6 text-[15px] leading-relaxed [&_h2]:font-display [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-bold [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-1.5 [&_a]:font-semibold [&_a]:text-accent-dark [&_a]:underline [&_a]:underline-offset-4">
        {children}
      </div>
    </div>
  );
}
