# Video Hub

A cross-platform video hub built with Vue 3, TypeScript, Tauri 2 and Capacitor.

> This project is an independent rebuild inspired by the general product experience of the public VipVideo project. It does not copy its binaries, scrape services, or bundle third-party parsing endpoints.

## Scope

- Web app and shared Vue UI.
- Desktop packaging with Tauri 2 (Windows, macOS, Linux).
- Mobile packaging with Capacitor (Android, iOS).
- User-managed source directory for sites and direct media URLs.
- Native HTML5 playback for direct media URLs, including HLS where supported by the browser/runtime.
- Watch history, favorites, source health checks and resilient local settings.
- Source adapters are limited to content and APIs the user is authorized to access. No paywall bypass, credential harvesting, DRM circumvention or unauthorized VIP parsing endpoints.

## Development

Requirements: Node.js 22+, npm 10+, and Rust toolchain for Tauri desktop builds.

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

## Platforms

- Web: `npm run dev` / `npm run build`
- Desktop: `npm run tauri:dev` / `npm run tauri:build`
- Mobile: `npm run cap:sync`, then open `android/` or `ios/` with the native IDE.

Capacitor native projects are generated locally with `npx cap add android` and `npx cap add ios`; platform SDKs and signing credentials are required for final packages.

## Security

- Only open URLs using HTTPS or HTTP; never execute content from a source.
- Do not embed untrusted parser scripts or remote JavaScript.
- Health checks are best-effort and may be limited by CORS.
- Review `SECURITY.md` before reporting vulnerabilities.

## License

This repository's original implementation is licensed under MIT. The upstream project is separately licensed; see its repository for its own terms.
