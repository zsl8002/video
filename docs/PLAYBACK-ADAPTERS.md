# Playback adapters

The adapter registry in `src/adapters/registry.ts` selects a playback implementation for a direct media URL.

## Current adapters

- **HLS**: uses HLS.js when Media Source Extensions are supported. Safari and other browsers with native HLS fall through to the native adapter.
- **Native HTML5**: delegates supported direct media formats to the browser media element.

## Adding an authorized provider

Implement the `PlaybackAdapter` interface in `src/adapters/types.ts`, then register the adapter before the native fallback. Provider integrations must use documented APIs and content the user is authorized to access. Do not implement credential scraping, DRM circumvention, paywall bypass, or unauthorized parsing endpoints.

An adapter should:
1. Validate and normalize its own input.
2. Avoid evaluating remote scripts or HTML as application code.
3. Report fatal playback errors through the supplied callback.
4. Return a cleanup function that releases media/network resources.
5. Never log access tokens, cookies, signed URLs, or private media metadata.
