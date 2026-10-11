import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET;
if (!secret || secret.length < 32) {
  throw new Error(
    "JWT_SECRET wajib diisi di server/.env (minimal 32 karakter). Buat dengan:\n" +
      "node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\""
  );
}
const SECRET: string = secret;

export type TokenScope = "user" | "admin";

export type AuthPayload = {
  sub: number;
  email: string;
  role: string;
  scope: TokenScope;
};

export function signToken(payload: AuthPayload) {
  return jwt.sign(payload, SECRET, {
    algorithm: "HS256",
    expiresIn: payload.scope === "admin" ? "8h" : "7d",
  });
}

export function verifyToken(token: string): AuthPayload {
  const decoded = jwt.verify(token, SECRET, { algorithms: ["HS256"] });
  if (typeof decoded === "string") throw new Error("Unexpected token payload");
  const payload = decoded as unknown as AuthPayload;
  if (payload.scope !== "user" && payload.scope !== "admin") throw new Error("Invalid token scope");
  return payload;
}
