// PostgreSQL's `contains` is case-sensitive unless told otherwise; SQLite does not accept `mode`.
const isPostgres = /^postgres(ql)?:/.test(process.env.DATABASE_URL ?? "");

export const insensitive = isPostgres ? ({ mode: "insensitive" } as const) : {};
