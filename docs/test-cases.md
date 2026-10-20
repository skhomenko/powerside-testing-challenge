# Test cases

This document defines the regression suite, its Smoke subset, and the manual
cases and exploratory coverage. Findings and verification results are recorded in the
[test report](test-report.md) and the automated report locations
in the [README](../README.md#run-the-tests).

## Browser regression cases

| ID | Case | Priority | Groups |
| --- | --- | --- | --- |
| TC-01 | Login and logout | High | Smoke, Regression |
| TC-02 | Dashboard loading and device link | High | Smoke, Regression |
| TC-03 | Device search, filters and pagination | Medium | Smoke (page load), Regression |
| TC-04 | Events and device links | High | Smoke (page load), Regression |
| TC-05 | Alarm filters and details | High | Smoke (page load), Regression |
| TC-06 | From and To dates | High | Regression |

### TC-01: Login and logout

**Purpose:** Protect access to monitoring data. Login and logout are frequent, repeatable Smoke checks.

**Preconditions and data:** Test credentials, a logged-out browser and a known device URL. Confirm one invalid attempt is safe for the account.

**Scenario:** Try missing and incorrect credentials, recover with valid login and reload. Log out, then use Back or open a protected URL directly.

**Expected:** Missing fields prevent submission. Invalid credentials produce a general error and allow retry. Valid login opens Dashboard and remains valid after reload. After logout, protected pages return to Login without records.

### TC-02: Dashboard loading and device link

**Purpose:** Check that the main overview is available and a device can be opened.

**Preconditions and data:** An authenticated account and a device shown on Dashboard.

**Scenario:** Open Dashboard, check its main sections and follow a device link.

**Expected:** Summary cards, recent alarms and the chart area load without an error. The link opens the device selected on Dashboard.

### TC-03: Device search, filters and pagination

**Purpose:** Find the right device without losing records through search, sorting or pagination. Automate these common interactions.

**Preconditions and data:** Known names, locations and statuses across pages, including records that should and should not match. Confirm the expected Name order.

**Scenario:** Search by name and location, combine each with the Status filter and sort both ways. Change pages and rows per page, recover from no matches and open a device.

**Expected:** Results and order match the test data. Pagination does not lose or repeat records, and filters remain selected. Clearing search and choosing All restores results. Details match the selected row.

### TC-04: Events and device links

**Purpose:** Keep events linked to the correct device during investigation. Automate navigation and representative filters; use API tests later for more combinations.

**Preconditions and data:** A device with known event values and types across several pages. Confirm the expected Magnitude order.

**Scenario:** Open device View all, filter by type, phase and category, sort by Magnitude and change pages. Open event details and View device, then clear filters after no results.

**Expected:** Device selection, results, order and detail values agree. View device returns the same device. Category and other fields are readable. Clear filters restores results.

### TC-05: Alarm filters and details

**Purpose:** Find relevant alarms without changing them. Keep severity separate from whether an alarm is active, acknowledged or resolved.

**Preconditions and data:** Alarms with different severities and statuses across two devices and several pages. Confirm which actions each status allows.

**Scenario:** Combine Status, Severity and Device filters, expand details and change pages and rows per page. Inspect handled records and reset from no matches. Submit no alarm action.

**Expected:** Exactly the matching alarms appear. Details match the selected record. Filters remain selected across pages, reset restores results and actions that are not allowed are unavailable.

### TC-06: From and To dates

**Purpose:** Keep daily investigations complete and within the selected dates. Known timestamps make boundary checks repeatable.

**Preconditions and data:** Records before, on and after a day, including late evening, with verified times and displayed dates. Record the browser timezone. Start with Eastern Time because the published date defects were reproduced using that setting.

**Scenario:** Test From alone, To alone and a same-day range on Alarms and Events. Move To forward one day and back.

**Expected:** From excludes earlier displayed days. To includes the whole selected displayed day and excludes later days. Equal From/To returns that day only. Returning To to the original day keeps that day's records included.

## Automated coverage

Smoke is a subset of the automated regression suite covering access, Dashboard
and the core list pages. Each test has one definition.

| ID | Implemented coverage | Specs |
| --- | --- | --- |
| TC-01 | Parameterized empty/username-only/password-only submission prevention; UI login; reload; logout; Back and direct protected navigation. | `smoke/access.cy.js` |
| TC-02 | Four summary cards, voltage chart and recent alarms; selected Dashboard device name matches the destination. | `smoke/dashboard.cy.js` |
| TC-03 | Page-load Smoke checks; parameterized name/location searches with and without Status, separate no-match recovery, Name sorting in both directions, forward/back pagination at 5 and 10 rows, page-size reset from page 2, and row navigation. | `smoke/devices.cy.js`, `regression/devices.cy.js` |
| TC-04 | Page-load Smoke checks including the ITIC chart; parameterized type/phase/category/ITIC/device filter combinations with matching/nonmatching witnesses; separate clear/empty recovery; numeric Magnitude sorting in both directions; filtered forward/back pagination at 10 and 25 rows; page-size reset from page 2; device View all, event details and View device agreement. | `smoke/events.cy.js`, `regression/events.cy.js` |
| TC-05 | Page-load Smoke checks; parameterized status, status/severity and status/severity/device filters; separate detail/collapse and empty/reset tests; forward/back pagination at 10 and 25 rows against complete discovery; page-size change from page 2 resets to page 1; read-only Active/Acknowledged/Resolved action availability. | `smoke/alarms.cy.js`, `regression/alarms.cy.js` |
| TC-06 | From alone, To alone with forward/back changes, and equal From/To on both pages. Expectations use unfiltered timestamps and displayed Toronto days, with morning, late-evening and adjacent-day witnesses. | `regression/dates.cy.js` |

All spec paths are relative to `cypress/e2e/`.

### API coverage

| ID | Selected checks and rationale | Specs |
| --- | --- | --- |
| API-01 | Parameterized protected-endpoint checks return 401 and no protected fields; valid API login grants access; logout removes client access without an extra cookie-clear command; failed tests attempt logout cleanup. Protects the access boundary independently of UI routing. | `api/auth.cy.js` |
| API-02 | Reconcile Dashboard total/offline devices, Active alarms, severity breakdown and distinct devices out of spec using device records and filtered per-device/severity alarm totals. Detects misleading overview data without downloading alarm history. | `api/dashboard.cy.js` |
| API-03 | Separate parameterized Online, Warning and Offline checks compare matching/nonmatching identities and totals with complete discovery; a dedicated pagination test compares two name-sorted pages. Checks API pagination metadata and backend filtering independently of UI rendering. | `api/devices.cy.js` |

All API checks use `cy.request()` without page navigation. Each authenticated
test starts its own API login. All API specs use shared logout cleanup that
preserves an existing test failure. API-01 starts with
no cookies. Specs run independently and are included in full Regression without
copying definitions. See the [session observation](test-report.md#session-revocation)
for the unresolved logout expectation. Date boundaries, exhaustive
filter combinations, writes and role comparisons are outside this API addition.
See the [test report](test-report.md#automated-verification) for results
and known failures.

### Additional manual coverage

- TC-01: invalid-credential recovery still needs confirmation that a new invalid
  attempt is safe for the shared account.
- TC-03: remaining sortable columns and exhaustive filter/page-size combinations.
- TC-04: return-state behavior, remaining combinations and visual retesting of
  [Category clipping](https://github.com/skhomenko/powerside-testing-challenge/issues/18).
  Text agreement alone does not verify that the entire value is visually readable.
- TC-05: submission and persistence of alarm actions remain outside authorization.
  The automated suite checks enabled/disabled controls without activating them.
  Confirm whether Alarms sorting is supported.
- TC-06: exact midnight instants, daylight-saving transitions, other timezones
  and the complete browser matrix. Missing boundary witnesses must produce an
  explicit data blocker.
- TC-07 through TC-10: keep settings, alarm actions and longer session checks manual.

## Manual scripted cases

Keep these browser cases manual initially. Saved settings and alarm actions need authorized isolated records and complete cleanup.

| ID | Case | Priority | Groups |
| --- | --- | --- | --- |
| TC-07 | Device settings | High | Regression |
| TC-08 | Individual Acknowledge and Resolve | High | Regression |
| TC-09 | Bulk acknowledgement | High | Regression |
| TC-10 | Restart, tabs and inactivity | High | Regression |

### TC-07: Device settings

**Purpose:** Check reset, saved values and updates across pages without leaving alarm effects. Keep manual until setup and cleanup are reliable.

**Preconditions and data:** Reserved device, private originals for all nine settings, allowed and invalid values, and an approved reset method.

**Scenario:** Change values and reset, then save changes and reload. Try missing or invalid values. Compare name and location across pages and check effects on alarms. Restore originals and verify cleanup.

**Expected:** Reset discards unsaved edits. Allowed values remain after reload; invalid values cannot be saved. Name and location agree across pages. Any new alarms match the expected effect of the test values and are cleaned up.

### TC-08: Individual Acknowledge and Resolve

**Purpose:** Change only the intended alarm to an allowed status. Keep manual until status rules and cleanup are established.

**Preconditions and data:** Separate test alarms for each action, already-handled alarms, confirmed permissions and safe reset. Confirm whether Resolve requires acknowledgement first.

**Scenario:** Perform each allowed action on a separate alarm, reload and compare details, device history and summaries. Check repeated actions where permitted.

**Expected:** Only the intended alarm changes, and related pages agree. Actions that are not allowed are unavailable. Repeated actions follow the agreed rules without applying a change twice.

**Cleanup:** Use an approved reset method, not another irreversible alarm action.

### TC-09: Bulk acknowledgement

**Purpose:** Prevent selection mistakes from changing unintended alarms. Keep manual until selection and partial-failure rules are clear.

**Preconditions and data:** Active and handled test alarms across pages, agreed selection behavior after filter and page changes, and complete cleanup.

**Scenario:** Select and clear records, change filters and pages, then submit Acknowledge selected once against known test records.

**Expected:** Only intended selected alarms that allow acknowledgement change. Handled and unselected records remain unchanged. Clear selection changes no statuses. Feedback and counts match the saved results.

### TC-10: Restart, tabs and inactivity

**Purpose:** Preserve valid sessions and end access after logout or timeout. Keep the longer timing checks outside Smoke.

**Preconditions and data:** Test account, two tabs and confirmed rules for inactivity, the warning and Stay signed in.

**Scenario:** Restart the browser. Log out in one tab and navigate or reload in another. Try the inactivity warning, Stay signed in and waiting for automatic logout.

**Expected:** A valid session survives restart. Logout or timeout removes protected access. The warning is readable and usable with the keyboard. Stay signed in extends the session for the agreed period.

## Exploratory follow-up

| Focus | Priority |
| --- | --- |
| Usability and accessibility | Medium |
| Charts and freshness | Medium |
| Authorization and error recovery | High |

### Usability and accessibility

Investigate a device or alarm using only the keyboard, a narrow viewport and enlarged text. Follow awkward navigation, unclear labels and empty-state recovery. Try View all in a new tab. Retest [keyboard navigation](https://github.com/skhomenko/powerside-testing-challenge/issues/3), the [harmonic label](https://github.com/skhomenko/powerside-testing-challenge/issues/5) and [Category clipping](https://github.com/skhomenko/powerside-testing-challenge/issues/18).

**Evidence:** Record the task, browser, viewport, focus order and what happened. State whether real devices or screen readers were used. Mobile acceptance depends on the open support question.

**Why exploratory:** Layout, wording and completing a task need human assessment. Repeatable findings can later receive focused automated checks.

### Charts and freshness

Compare current readings with history, switch harmonic views and try the 1h, 24h, 7d and 30d ranges. Compare event lists, details and the scatter chart using known values or domain help. Explore midnight and daylight-saving changes once timezone rules are agreed. Watch whether slow updates make old readings look current; record lightweight task timings without generating load.

**Evidence:** Record the compared values, sample count, reference and measured delays. State which calculations were checked and which charts were only inspected visually. Establish a baseline before proposing performance targets.

**Why exploratory:** Measurement meaning and acceptable delay still need agreement.

### Authorization and error recovery

Use approved accounts and observed endpoints to investigate access before login, after logout and after timeout. Compare roles only if accounts and access rules are supplied. Inspect cookie protections, transport security and sensitive-data exposure.

In a controlled environment, stub empty, delayed, malformed and failed responses to inspect validation, stale data, retries and recovery. Tests involving half-completed saves or repeated alarm actions need isolated data and verified cleanup.

**Evidence:** Once request and response contracts are confirmed, record the method, endpoint, status and actual outcome. Exclude credentials, cookies, tokens and sensitive response data.

**Why exploratory first:** Confirm permission and error expectations before automating them.
