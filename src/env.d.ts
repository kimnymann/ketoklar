/// <reference types="astro/client" />
/// <reference types="../worker-configuration" />

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}
