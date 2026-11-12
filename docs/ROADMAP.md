# Roadmap

## Foundation
- [x] Vue 3 + TypeScript + Vite UI
- [x] Tauri 2 desktop project skeleton
- [x] Capacitor configuration
- [x] Local source directory, favorites and history
- [x] Direct media playback with HLS.js fallback
- [x] Basic CI typecheck and web build

## Phase 2 — playback and data portability
- [x] Playback adapter registry (HLS and native HTML5)
- [x] Media URL diagnostics with HEAD / byte-range fallback
- [x] JSON backup import/export with schema validation
- [x] External WebVTT subtitle track support
- [x] Playback reload and improved fatal-error reporting

## Reliability and releases
- [ ] Unit and component tests
- [ ] Multiple authorized playback routes per media item
- [ ] Provider-specific adapters using documented, authorized APIs
- [ ] Import/export compatibility tests and storage migration
- [ ] Android/iOS native projects and permissions
- [ ] Tauri release builds, code signing and notarization
- [ ] Checksums and signed release artifacts

Only adapters for authorized providers, public-domain media, user-owned libraries or explicitly permitted APIs may be implemented. No paywall circumvention, DRM removal, credential scraping or unauthorized VIP parsing endpoints.
