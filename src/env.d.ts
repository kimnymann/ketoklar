/// <reference types="astro/client" />
/// <reference types="../worker-configuration" />

// Secrets står kun i Cloudflare og må ikke skrives i wrangler.jsonc.
declare namespace Cloudflare {
  interface Env {
    TURNSTILE_SECRET_KEY: string;
  }
}

interface Env {
  TURNSTILE_SECRET_KEY: string;
}

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}
