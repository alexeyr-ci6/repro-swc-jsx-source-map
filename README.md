# SWC development JSX locations with an incoming map

This uses only SWC's JavaScript API and a hand-built incoming map. A React stub records props; React itself is not a dependency.

```sh
npm ci
npm test
```

The original JSX is on line 8. A previous compilation stage has removed six blank lines, leaving JSX on line 2. Its complete source map maps every input column back to the original source.

Expected: the generated runtime map identifies the retained error on original line 9, and React's generated `__source.lineNumber` identifies JSX on original line 8.

Reported behavior: runtime mapping follows the incoming map, but `__source.lineNumber` remains 2. `npm test` prints both locations, then asserts the original JSX location. No bundler, third-party transform or Wasm plugin is involved.

Versions are pinned in package-lock.json. Use Node.js 24 on Linux. This report asks whether development JSX metadata is intended to consume the incoming map, or whether an additional integration step is required.
