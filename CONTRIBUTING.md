# Contributing to Kharcha

Thanks for helping. Kharcha is small on purpose, so changes are easy to review.

## Getting started

```bash
cd web
npm install
npm run dev
```

Before opening a pull request, run:

```bash
npm test
npm run build   # also type-checks
```

## Good first contributions

- **Your bank's statement format.** If a CSV or `.xlsx` export doesn't import cleanly, add its column names to `ALIASES` in `web/src/core/normalize.ts` and a test in `web/src/core/core.test.ts`. Please remove any personal data from example rows.
- **Merchant keywords.** Add Indian merchants to `RULES` in `web/src/core/categorize.ts`. Keywords match whole words only.
- **Translations.** Strings for the landing page live in `web/src/landing/i18n.ts`.

## Principles

- **Data stays on the device.** Don't add network requests, analytics or third-party scripts. Fonts and libraries are bundled.
- **Logic lives in `src/core`.** Keep it free of React and the DOM so it stays easy to test.
- **Accessible by default.** Real buttons and labels, visible focus, text contrast of at least 4.5:1, and respect for reduced motion.
