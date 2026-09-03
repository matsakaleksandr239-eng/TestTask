# E2E tests

Playwright + TypeScript test suite for `mcp.example-dev.com` (contacts management).

## Status

- **Contacts** (`contact-add.spec.ts`, `contact-edit.spec.ts`) — creating and editing a custom
  contact, checkbox state, and field validation (required fields, special characters, email
  format, phone number rules).

Some checks are left failing on purpose via `test.fixme` instead of being worked around: a few are
known product defects, commented inline with what's wrong (e.g. the client accepting a
trailing-dot email or a 5/6-digit phone number that the server later rejects); the rest are
coverage not written yet (e.g. the page-text/label checks in `contact-edit.spec.ts`).

## Prerequisites

- Node.js >= 18
- npm

## Install

```bash
npm install
npx playwright install --with-deps chromium
```

If `--with-deps` fails without root access, run `npx playwright install chromium` instead and
install the missing OS libraries separately.

## Configure

```bash
cp .env.example .env
```

Fill in `.env`:

```
BASE_URL=https://mcp.example-dev.com
LOGIN_EMAIL=<your login email>
LOGIN_PASSWORD=<your password>
```

Note: if the password contains a `#`, wrap the value in quotes (`LOGIN_PASSWORD="a#b"`) — otherwise
it gets truncated as an inline comment.

## Run

```bash
npm test              # run everything (auth setup + all e2e tests)
npm run test:headed   # same, with a visible browser
npm run test:ui       # Playwright UI mode
npm run report        # open the last HTML report
npm run typecheck     # type-check the project without running anything

# run a single file (the one-time login in `globalSetup` still runs first, automatically)
npx playwright test --project=e2e tests/e2e/contact-add.spec.ts

# run a single test by name (matches on the test title)
npx playwright test --project=e2e -g "creates a new contact"
```

To run and re-run individual tests by clicking instead of typing commands, use
`npx playwright test --ui` (same as `npm run test:ui`) — Playwright's own UI Test Runner, which
opens a window listing every test, with buttons to run one test, one file, or watch mode. The
"Playwright Test for VS Code" extension does the same thing inline, adding a run button next to
each test in the editor and in VS Code's Testing sidebar.

**The whole suite runs with a single worker (`workers: 1` in `playwright.config.ts`).** All tests
log in as the same one real account (there's no second test account to give each worker its own
session), and concurrent requests sharing one logged-in session occasionally make the dev server
respond with an error page instead of JSON — a single worker avoids that entirely.

## Visual regression screenshots

Some tests use Playwright's `toHaveScreenshot()`, which compares each run against a baseline PNG.
Those baselines live under `.snapshots/` — a gitignored top-level folder, not committed to the
repo — so every environment generates and keeps its own. (They deliberately don't live under
`test-results/`, since Playwright wipes that folder at the start of every run — a baseline stored
there would never survive to be compared against.)

This means the very first time you run a screenshot test on a machine (or after a real layout
change), it "fails" while writing that machine's baseline image; every run after that compares
against it and passes normally. If you ever want to reset a baseline (e.g. after an intentional
UI change), just delete `.snapshots/` and let the next run regenerate it.

## Project structure

```
utils/globalSetup.ts            # one-time login (via the UI form), reused via storageState
utils/env.ts                   # typed, fail-fast environment config
utils/matchers.ts               # asymmetric matcher for server timestamps (e.g. updated_at)

tests/e2e/
  contact-add.spec.ts           # add-contact form: UI checks + field validation + creation
  contact-edit.spec.ts          # edit-contact form: same validation coverage + field updates

pages/                          # Page Objects (one per page)
  BasePage.ts                   # shared `table` component
  AContactFormPage.ts           # abstract base for the add/edit contact forms
  ContactAddPage.ts, ContactEditPage.ts
  ContactsPage.ts
components/Table.ts             # generic data-table helper (row lookup, cell value checks)

factories/                      # test data builders (faker-based) and fixed reference data
  contact.ts, contactValidation.ts, country.ts

api/                             # direct API calls used for test setup/teardown/verification
  contacts.ts, index.ts

fixtures/fixturePages.ts        # wires Page Objects and API-backed fixtures into `test`
```

Auth note: the app gates its routes on both a session cookie and a set of `auth.*` localStorage
flags set by its own login JS, so `globalSetup` logs in once through the real UI form (not a raw
API call) and saves the resulting `storageState` for reuse by all e2e tests.
