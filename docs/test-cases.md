# Test cases and results

Manual checks were performed on 19 October 2026 using an Operator account at [Power Quality Monitor](https://testapp.andresfloresv.com). Recorded viewports were 1440 x 900, 390 x 844 and 320 x 568. The harmonic-label check also used 1690 x 900.

TC-02 was rerun on the same date at 1280 x 720.

## Automation candidates

These are proposed browser E2E tests.

| ID | Case | Priority | Groups | Manual result |
| --- | --- | --- | --- | --- |
| TC-01 | Login and logout | High | Smoke, Regression | Partly run |
| TC-02 | Dashboard loading and device link | High | Smoke, Regression | Passed, one device link sampled |
| TC-03 | Device search, filters and pagination | Medium | Regression | Partly run |
| TC-04 | Events and device links | High | Regression | Partly run |
| TC-05 | Alarm filters and details | High | Regression | Partly run |
| TC-06 | From and To dates | High | Regression | Failed: [To](https://github.com/skhomenko/powerside-testing-challenge/issues/8), [From](https://github.com/skhomenko/powerside-testing-challenge/issues/17) |

### TC-01: Login and logout

**Purpose:** Protect access to monitoring data. Login and logout are frequent, repeatable Smoke checks.

**Preconditions and data:** Test credentials, a logged-out browser and a known device URL. Confirm one invalid attempt is safe for the account.

**Scenario:** Try missing and incorrect credentials, recover with valid login and reload. Log out, then use Back or open a protected URL directly.

**Expected:** Missing fields prevent submission. Invalid credentials produce a general error and allow retry. Valid login opens Dashboard and remains valid after reload. After logout, protected pages return to Login without records.

**Execution:** Required fields, invalid-login recovery, reload and sampled logout navigation worked. Direct device and Alarms URLs returned to Login.

**Not covered yet:** A complete rerun of this case with controlled test data.

### TC-02: Dashboard loading and device link

**Purpose:** Check that the main overview is available and a device can be opened.

**Preconditions and data:** An authenticated account and a device shown on Dashboard.

**Scenario:** Open Dashboard, check its main sections and follow a device link.

**Expected:** Summary cards, recent alarms and the chart area load without an error. The link opens the device selected on Dashboard.

**Execution:** Passed in the manual rerun. All four summary cards, Recent alarms and the Live voltage chart loaded without a displayed error. One device link from Recent alarms was opened, and the destination page showed exactly the same device name.

### TC-03: Device search, filters and pagination

**Purpose:** Find the right device without losing records through search, sorting or pagination. Automate these common interactions.

**Preconditions and data:** Known names, locations and statuses across pages, including records that should and should not match. Confirm the expected Name order.

**Scenario:** Search by name and location, combine each with the Status filter and sort both ways. Change pages and rows per page, recover from no matches and open a device.

**Expected:** Results and order match the test data. Pagination does not lose or repeat records, and filters remain selected. Clearing search and choosing All restores results. Details match the selected row.

**Execution:** Offline returned 2 devices in the observed dataset; All restored the list. Partial-name search and no-match recovery worked. Name descending and the final-page Next boundary were checked.

**Not covered yet:** Location search, combined search and status, other sorting and page-size combinations.

### TC-04: Events and device links

**Purpose:** Keep events linked to the correct device during investigation. Automate navigation and representative filters; use API tests later for more combinations.

**Preconditions and data:** A device with known event values and types across several pages. Confirm the expected Magnitude order.

**Scenario:** Open device View all, filter by type, phase and category, sort by Magnitude and change pages. Open event details and View device, then clear filters after no results.

**Expected:** Device selection, results, order and detail values agree. View device returns the same device. Category and other fields are readable. Clear filters restores results.

**Execution:** Device navigation, Sag and Swell filters, event details and empty-state recovery were sampled. Category = Sustained, Phase = L1 and ITIC = Fail returned no results. Pagination moved from rows 1-15 to 16-30; selecting 25 displayed 25 rows. Magnitude showed a descending sort state.

**Not covered yet:** Numeric Magnitude order, other combinations, return-state behavior and a retest of published [Category clipping](https://github.com/skhomenko/powerside-testing-challenge/issues/18).

### TC-05: Alarm filters and details

**Purpose:** Find relevant alarms without changing them. Keep severity separate from whether an alarm is active, acknowledged or resolved.

**Preconditions and data:** Alarms with different severities and statuses across two devices and several pages. Confirm which actions each status allows.

**Scenario:** Combine Status, Severity and Device filters, expand details and change pages and rows per page. Inspect handled records and reset from no matches. Submit no alarm action.

**Expected:** Exactly the matching alarms appear. Details match the selected record. Filters remain selected across pages, reset restores results and actions that are not allowed are unavailable.

**Execution:** Critical plus Resolved displayed matching values; All restored results. Sampled handled rows had no enabled Acknowledge or Resolve actions. Details showed expanded state. The sampled Active-filter page contained Active alarms.

**Not covered yet:** Device filtering, pagination correctness, the complete action matrix and whether alarm sorting is supported.

### TC-06: From and To dates

**Purpose:** Keep daily investigations complete and within the selected dates. Known timestamps make boundary checks repeatable.

**Preconditions and data:** Records before, on and after a day, including late evening, with verified times and displayed dates. Record the browser timezone. Start with Eastern Time because the published date defects were reproduced using that setting.

**Scenario:** Test From alone, To alone and a same-day range on Alarms and Events. Move To forward one day and back.

**Expected:** From excludes earlier displayed days. To includes the whole selected displayed day and excludes later days. Equal From/To returns that day only. Returning To to the original day keeps that day's records included.

**Execution:** From included records displayed on the previous day. To omitted late-evening records that appeared when To advanced one day and disappeared when it was restored. Both failures were observed on Alarms and Events. A same-day Alarms range returned results.

**Not covered yet:** Complete midnight, timezone and combined-boundary coverage. The exact cutoff and cause remain unknown.

## Manual scripted cases

Keep these browser cases manual initially. Saved settings and alarm actions need authorized isolated records and complete cleanup.

| ID | Case | Priority | Groups | Manual result |
| --- | --- | --- | --- | --- |
| TC-07 | Device settings | High | Regression | Partly run |
| TC-08 | Individual Acknowledge and Resolve | High | Regression | Partly run |
| TC-09 | Bulk acknowledgement | High | Regression | Partly run |
| TC-10 | Restart, tabs and inactivity | High | Regression | Partly run |

### TC-07: Device settings

**Purpose:** Check reset, saved values and updates across pages without leaving alarm effects. Keep manual until setup and cleanup are reliable.

**Preconditions and data:** Reserved device, private originals for all nine settings, allowed and invalid values, and an approved reset method.

**Scenario:** Change values and reset, then save changes and reload. Try missing or invalid values. Compare name and location across pages and check effects on alarms. Restore originals and verify cleanup.

**Expected:** Reset discards unsaved edits. Allowed values remain after reload; invalid values cannot be saved. Name and location agree across pages. Any new alarms match the expected effect of the test values and are cleaned up.

**Execution:** The full edit, reset and save flow was checked, including updated name and location at the top of the device page. All 9 original settings matched after restoration and reload; Save and Reset changes were disabled. Selected validation checks were completed.

**Not covered yet:** Updates in Devices and other pages, complete server validation, concurrent edits and effects on alarms.

### TC-08: Individual Acknowledge and Resolve

**Purpose:** Change only the intended alarm to an allowed status. Keep manual until status rules and cleanup are established.

**Preconditions and data:** Separate test alarms for each action, already-handled alarms, confirmed permissions and safe reset. Confirm whether Resolve requires acknowledgement first.

**Scenario:** Perform each allowed action on a separate alarm, reload and compare details, device history and summaries. Check repeated actions where permitted.

**Expected:** Only the intended alarm changes, and related pages agree. Actions that are not allowed are unavailable. Repeated actions follow the agreed rules without applying a change twice.

**Execution:** One alarm was acknowledged and then resolved. Both status changes showed in the UI. After Resolve, its Acknowledge and Resolve buttons were disabled.

**Not covered yet:** Reload, device history and Dashboard counts after the change. Resolve without acknowledging first, and repeated actions.

**Cleanup:** Use an approved reset method, not another irreversible alarm action.

### TC-09: Bulk acknowledgement

**Purpose:** Prevent selection mistakes from changing unintended alarms. Keep manual until selection and partial-failure rules are clear.

**Preconditions and data:** Active and handled test alarms across pages, agreed selection behavior after filter and page changes, and complete cleanup.

**Scenario:** Select and clear records, change filters and pages, then submit Acknowledge selected once against known test records.

**Expected:** Only intended selected alarms that allow acknowledgement change. Handled and unselected records remain unchanged. Clear selection changes no statuses. Feedback and counts match the saved results.

**Execution:** Select all active on page exposed Acknowledge selected and Clear selection; deselection cleared it.

**Not covered yet:** Submission, handling already-acknowledged records, selection after filter or page changes and partial success.

### TC-10: Restart, tabs and inactivity

**Purpose:** Preserve valid sessions and end access after logout or timeout. Keep the longer timing checks outside Smoke.

**Preconditions and data:** Test account, two tabs and confirmed rules for inactivity, the warning and Stay signed in.

**Scenario:** Restart the browser. Log out in one tab and navigate or reload in another. Try the inactivity warning, Stay signed in and waiting for automatic logout.

**Expected:** A valid session survives restart. Logout or timeout removes protected access. The warning is readable and usable with the keyboard. Stay signed in extends the session for the agreed period.

**Execution:** Restart retained login. The second tab returned to Login on reload after logout. Inactivity showed a warning; Stay signed in extended access, and waiting without extension logged out.

**Not covered yet:** Exact timing, keyboard use and backend revocation. Release notes state a 10-minute timeout and one-minute warning; these timings have not been measured.

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

No security defects found in the checks performed. Backend authorization and session revocation remain unverified.
