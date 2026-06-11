import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// 1. Define the base policy that applies everywhere
let csp = `
  default-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  connect-src 'self'  wss://*.pusher.com https://*.pusher.com;
`;

// 2. Conditionally append the script-src based on the environment
if (isDev) {
  // Relaxed for local Next.js hot-reloading
  csp += ` script-src 'self' 'unsafe-inline' 'unsafe-eval';`;
} else {
  // Strict for production
  csp += ` script-src 'self';`;
}

// 3. Clean up the string formatting for the browser
const formattedCsp = csp.replace(/\s{2,}/g, " ").trim();

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value: formattedCsp, // Inject the dynamic string here!
          },
        ],
      },
    ];
  },
};

export default nextConfig;
