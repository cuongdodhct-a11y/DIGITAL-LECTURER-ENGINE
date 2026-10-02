# Phase 1 — Engine Verification

## Baseline
- Repository: `cuongdodhct-a11y/DIGITAL-LECTURER-ENGINE`
- Branch: `build-1md-engine`
- Baseline main: `b23420c57d3f2c7d86bf10536a09c7e363bf1eeb`
- Production application `DIGITAL-LECTURER-2026` is not modified by this branch.

## Implemented
- Course contract for `COURSE-1MD`.
- Ten independent lesson package descriptors: `LPKG-1MD1-001` … `LPKG-1MD10-001`.
- Shared course common-source set `COMMON-1MD` for Levels 2, 4, 5, 6, 7.
- Package resolver with course/package membership guard.
- Course Engine API mounted under `/api/course-engine`.
- Phase 1 Course Engine UI entry point.
- CI verification workflow for lint, build, runtime API, and package isolation.

## Verification performed
GitHub Actions run for the latest branch commit completed successfully:
- `npm install`
- `npm run lint`
- `npm run build`
- runtime API smoke test
- all ten package contract checks
- package uniqueness/isolation checks
- rejection of an unknown cross-package ID

## Acceptance evidence
- Course exposes exactly 10 packages.
- Package IDs are unique and ordered 1MD1 → 1MD10.
- Every package resolves to `COURSE-1MD`.
- Every package uses the same declarative `COMMON-1MD` source-set reference.
- Every package is marked isolated.
- 1MD1 resolves only to `LPKG-1MD1-001`.
- 1MD7 resolves only to `LPKG-1MD7-001`.
- 1MD10 resolves only to `LPKG-1MD10-001`.
- Unknown package `LPKG-CS401-007` is rejected with HTTP 404.

## Fixes required by verification
- CI initially failed because the repository had no lockfile while setup-node npm caching required one. The cache dependency was removed from the Phase 1 workflow; `npm install` remains the installation step.
- CI then exposed a real dependency peer conflict: Vite 8 requires esbuild >=0.27, while the project declared esbuild ^0.25. The declaration was aligned to `^0.28.0`.
- CI then exposed pre-existing TypeScript errors in Phase 1.5.8 verification fixtures. They were corrected without changing runtime behavior: the tests now use the canonical production package object and provide the required TTS voice-status metadata.

## Not yet included
- No 1MĐ1–1MĐ10 Word/PPTX academic source files.
- No generated lecture content.
- No production deployment.
- No modification to the frozen `DIGITAL-LECTURER-2026` production application.

## Next phase gate
Phase 1 content onboarding must remain blocked until the Engine contract is accepted. The next implementation step is package-aware source registration/building for a pilot package, without changing the authoritative Word/PPTX source content.
