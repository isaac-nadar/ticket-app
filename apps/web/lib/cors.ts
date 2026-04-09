import { NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://ticket.reddway.io",
];

export function withCors(res: NextResponse, origin: string | null) {
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
  }

  res.headers.set(
    "Access-Control-Allow-Methods",
    "GET,POST,PATCH,DELETE,OPTIONS"
  );
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Authorization,Content-Type,Idempotency-Key"
  );

  return res;
}
