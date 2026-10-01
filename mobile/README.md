# Turath2026 · the app

A native reading app for this site, not a copy of it. The same 14 books and 344 chapters, re-shaped
around what a reader needs on a phone: where was I, what should I read for how I feel today, and
reading that is comfortable for an hour. Arabic first, right to left throughout, fully offline.
Bundle id `com.turath2026.app`, team `M3RPNM736H`, iOS 15.5+ (iPhone), Android 6+.

## The experience

| Tab | What it answers |
| --- | --- |
| **اليوم** Today | Hijri date and a greeting; the day's wisdom (stable all day) with save and share-as-image; **continue reading** with time left; "how do you feel today?" chips that open a prescription; a pick tuned to what you chose at onboarding; your week (minutes, chapters finished, streak). |
| **المكتبة** Library | Your desk (books you started, with progress), shelves, and each book's page: the cover in its own hue, one button that knows where you are ("start" or "continue: chapter 12"), a contents list showing done, in progress and minutes. |
| **الدليل** Guide | The site's promise ("the tradition holds the cure but lost its index") made into a tool: by feeling, by area of life, by the 22 ailments in 7 families, by the 6 layers. Every entry is a **prescription**: chapters across all books, best first, capped per book so it reads as a selection. |
| **بحث** Search | Instant, forgiving search (أ/ا, ة/ه, ى/ي, diacritics ignored), matches highlighted, recent searches and suggestions before you type. |
| **محفوظاتي** Saved | Bookmarks, highlights, saved wisdom, reading stats, settings. |

**The reader** is the heart: chrome hides as you read and returns when you scroll back or tap; it opens where
you left off (with "from the start" one tap away); select text to highlight, copy or make a share card;
themes (paper, sepia, night, black, auto), size, Naskh or Amiri, line spacing, all live; contents sheet that
marks where you are; footnotes folded away; a completion moment with a haptic and the next chapter ready.
Reading time counts only while you are actually reading.

Native touches: right-to-left push navigation with edge-swipe back from the right, a tab bar that returns a
tab to its root on second tap, sheets you drag to dismiss, haptics on meaningful taps, share cards as real
PNG files (1080×1350, three styles), status bar following the theme, Android back button, splash held until
content is ready. Everything the reader leaves behind stays on the device (localStorage mirrored to
Capacitor Preferences so iOS cannot purge it).

## How it is built

```
site (this repo) ──scripts/extract.mjs──▶ public/data/  ──vite──▶ www/ ──cap sync──▶ ios/, android/
```
- `scripts/extract.mjs` reads the site's pages and writes `catalog.json` (books, units with their ailment,
  layer and arc tags, the framework, feelings, quotes) and one JSON per chapter. It repairs what the site's
  markdown flattened: 1,800 bullet lists and 400 numbered lists come back as real lists, inline footnotes
  split into notes, and the middle dot in headings (which reads as an Arabic zero next to Arabic digits)
  becomes a colon. Introductions (`intro/`) become unit 0, labelled المقدمة.
- `scripts/check.mjs` refuses the build if any chapter is missing or thin, a contents entry has no heading,
  or a quote, feeling or search entry points at something that is not there.
- `src/`: Svelte 5. `App.svelte` is the shell (tabs, stacks, reader, sheets), `screens/` one file per screen,
  `lib/` data, state, navigation, native wrappers, highlight painting and the share-card renderer.

## Every build

```
cd mobile && npm install
npm run dev           # extract + vite dev server, for working in a browser
npm run sync          # extract, build, check, cap sync
```

**Android.** Every push touching `mobile/` runs `.github/workflows/android.yml`, which builds a debug APK and
uploads it as the `turath2026-debug-apk` artifact.

**iOS → TestFlight.** `.github/workflows/testflight.yml` builds on a GitHub macOS runner, signs with Xcode
cloud signing and uploads. Run it from Actions → Turath2026 · TestFlight → Run workflow (enter a version), or
push an `ios-<version>` tag. Needs the repo secrets `ASC_KEY_ID`, `ASC_ISSUER_ID` and `ASC_KEY_P8` (an
Admin-role App Store Connect API key). The build number is the run number.

**By hand on a Mac.** `brew install cocoapods`, then `cd mobile && npm install && LANG=en_US.UTF-8 npm run sync`
and `open ios/App/App.xcworkspace`. Always set `LANG`: CocoaPods fails on the Arabic app paths without it.
`AppDelegate.swift` and `Info.plist` carry a UIScene delegate, which iOS 27 requires of apps built against the
iOS 26 SDK.

## Publishing to the App Store

The listing lives in `fastlane/`: Arabic and English text in `metadata/<locale>/` (subtitle, description, keywords,
promotional text, privacy, support and marketing links) and seven 1320×2868 screenshots per locale in
`screenshots/`. The privacy policy and support pages are part of the site: `privacy/` and `app/` at the repo root.

1. Ship the build: Actions → Turath2026 · TestFlight → Run workflow (version, e.g. `1.2`). Note the run number:
   it is the build number.
2. Once, in App Store Connect (only the account holder can answer these): **App Privacy** → "Data Not Collected";
   **Age Rating** questionnaire (no objectionable content; 4+); **Pricing and Availability** → Free; **App Review
   Information** → a contact name, phone and email.
3. Actions → Turath2026 · App Store listing → Run workflow with the same version and build number. It uploads the
   text and screenshots and attaches the build. Tick **submit** to send it to App Review in the same run, or press
   "Add for Review" in App Store Connect afterwards. Releases go out automatically once Apple approves.

The screenshots were taken from the real app (with a seeded reading history) and framed with Arabic captions;
redo them after a visible design change.

## Icons and splash

`assets/` holds the sources, drawn from the site's `assets/mark.svg`. After changing them:
```
npx capacitor-assets generate --ios --android --iconBackgroundColor '#1F5E57' \
  --splashBackgroundColor '#F5EFE3' --splashBackgroundColorDark '#15130F'
```

New site content reaches readers only with a new app build: run the TestFlight workflow after publishing.
