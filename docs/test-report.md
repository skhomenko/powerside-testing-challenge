# Test report

| ID | Case | Result |
| --- | --- | --- |
| TC-01 | Login and logout | Partly run |
| TC-02 | Dashboard loading and device link | Passed, one device link sampled |
| TC-03 | Device search, filters and pagination | Partly run |
| TC-04 | Events and device links | Partly run |
| TC-05 | Alarm filters and details | Partly run |
| TC-06 | From and To dates | Failed: [To](https://github.com/skhomenko/powerside-testing-challenge/issues/8), [From](https://github.com/skhomenko/powerside-testing-challenge/issues/17) |
| TC-07 | Device settings | Partly run |
| TC-08 | Individual Acknowledge and Resolve | Partly run |
| TC-09 | Bulk acknowledgement | Partly run |
| TC-10 | Restart, tabs and inactivity | Partly run |

The tables summarize manual findings and automated verification. See
[test cases](test-cases.md) for scope and the [README](../README.md#results-and-known-failures)
for generated reports.

## Product assessment

I like the path from Dashboard to a device and its events. Sampled links opened
the right records. The event details showed the same values as the list, and
API checks reconciled the Dashboard counts. This gives users a useful starting
point for investigation.

Date filtering is the main weakness. `From` can include the previous day, and `To`
can omit late-evening records. I would fix these first because they can make an
investigation misleading or incomplete. Keyboard access to list records comes
next. Some controls work with the keyboard, but the checked rows cannot be
opened without a mouse. The event category and the label below the harmonic
chart are cut off.

Show a clear message when `From` is later than `To`, and add a Devices clear-all
action. These are improvements, not confirmed requirement failures. First and
Last page buttons would reduce repeated navigation. Letting View all open in a
new tab would keep the device page available while investigating events.
Show password would help users check their typing, a Help link would provide
instructions, and remembering which release notes a user has read would avoid
repeated interruptions. Mobile support and account access remain
[open questions](https://github.com/skhomenko/powerside-testing-challenge/issues?q=is%3Aissue%20label%3Aquestion).

Access, data consistency and finding the right records drove the testing
priorities. Repeatable browser workflows suited automation. API checks added
independent access and data checks. Usability and unclear behavior needed
exploration. Settings, alarm actions and longer sessions remain partly tested,
with safe setup, cleanup and expectations still limiting coverage.

## Manual observations

### TC-01: Login and logout

**Observed:** Required fields, reload and sampled logout navigation worked.
Direct device and Alarms URLs returned to Login. Recovery after invalid
credentials worked during earlier exploration; that attempt was not repeated
during targeted discovery because the account lockout policy remains unconfirmed.

**Not covered yet:** A complete rerun of this case with controlled test data.

### TC-02: Dashboard loading and device link

**Observed:** All four summary cards, Recent alarms and the Live voltage chart loaded without a displayed error. One device link from Recent alarms was opened, and the destination page showed exactly the same device name.

### TC-03: Device search, filters and pagination

**Observed:** Offline returned 2 devices in the observed dataset; All restored the list. Partial-name search and no-match recovery worked. Name descending and the final-page Next boundary were checked.

**Not covered yet:** Location search, combined search and status, other sorting and page-size combinations.

### TC-04: Events and device links

**Observed:** Device navigation, Sag and Swell filters, event details and empty-state recovery were sampled. Category = Sustained, Phase = L1 and ITIC = Fail returned no results. Pagination moved from rows 1-15 to 16-30; selecting 25 displayed 25 rows. Magnitude showed a descending sort state.

**Not covered yet:** Numeric Magnitude order, other combinations, return-state behavior and a retest of published [Category clipping](https://github.com/skhomenko/powerside-testing-challenge/issues/18).

### TC-05: Alarm filters and details

**Observed:** Critical plus Resolved displayed matching values; All restored results. Sampled handled rows had no enabled Acknowledge or Resolve actions. Details showed expanded state. The sampled Active-filter page contained Active alarms.

**Not covered yet:** Device filtering, pagination correctness, the complete action matrix and whether alarm sorting is supported.

### TC-06: From and To dates

**Observed:** From included records displayed on the previous day. To omitted late-evening records that appeared when To advanced one day and disappeared when it was restored. Both failures were observed on Alarms and Events. A same-day Alarms range returned results.

**Not covered yet:** Complete midnight, timezone and combined-boundary coverage. The exact cutoff and cause remain unknown.

### TC-07: Device settings

**Observed:** The full edit, reset and save flow was checked, including updated name and location at the top of the device page. All 9 original settings matched after restoration and reload; Save and Reset changes were disabled. Selected validation checks were completed.

**Not covered yet:** Updates in Devices and other pages, complete server validation, concurrent edits and effects on alarms.

### TC-08: Individual Acknowledge and Resolve

**Observed:** One alarm was acknowledged and then resolved. Both status changes showed in the UI. After Resolve, its Acknowledge and Resolve buttons were disabled.

**Not covered yet:** Reload, device history and Dashboard counts after the change. Resolve without acknowledging first, and repeated actions.

### TC-09: Bulk acknowledgement

**Observed:** Select all active on page exposed Acknowledge selected and Clear selection; deselection cleared it.

**Not covered yet:** Submission, handling already-acknowledged records, selection after filter or page changes and partial success.

### TC-10: Restart, tabs and inactivity

**Observed:** Restart retained login. The second tab returned to Login on reload after logout. Inactivity showed a warning; Stay signed in extended access, and waiting without extension logged out.

**Not covered yet:** Exact timing, keyboard use and backend revocation. Release notes state a 10-minute timeout and one-minute warning; these timings have not been measured.

## Targeted discovery

Targeted checks use the supplied Operator account and displayed calendar dates
to investigate filter combinations, record identity and the known date defects.

| ID | Additional executed checks | Result and limit |
| --- | --- | --- |
| TC-01 | Log out, directly open Alarms, sign in again and reload the protected page. | Protected navigation returned to Login; valid sign-in returned to the requested page and reload retained access. Invalid credentials were not retried because the account lockout policy remains unconfirmed. |
| TC-02 | Inspect Dashboard sections and follow a Recent alarms device link. | All four summary headings, Live voltage and Recent alarms appeared. The selected device name exactly matched the destination heading. |
| TC-03 | Search a shared location, then combine it with Online status. | The location initially showed mixed statuses. Online removed the Warning row and retained the two matching Online rows. Ordering and identity checks are covered by the automated suite. |
| TC-04 | Check displayed Magnitude values in both sort directions; sample a type filter; follow device View all, open an event and return through View device. | Sampled magnitudes were numerically ordered. List and detail agreed on device, type, magnitude, category, phases and ITIC result. Full Category clipping was not visually reassessed. |
| TC-05 | Combine Resolved, Critical and a device; inspect expansion; reset and navigate pages. | Sampled rows matched the three filters. Expanded measurement, threshold, actual value and location were present; Resolved actions were disabled. No action was submitted. Pagination identities and the action matrix are covered by the automated suite. |
| TC-06 | Compare a same-day alarm range and move To forward/back; check Events From alone and To forward/back. | Alarms included the preceding displayed day and omitted late evening on the selected day. Events From included a preceding-day late record. Advancing To restored the late Events record; restoring To removed it. Known defects remain reproduced. |

## Automated verification

| Checks | Result |
| --- | --- |
| Syntax, shell, Make commands, Docker build/configuration | Passed |
| Approved-origin configuration checks | Passed; invalid and non-approved URLs rejected |
| API locally (`npm run test:api`) and in Docker (`make run-api`) | 10 passed in each environment |
| Browser Smoke (`npm run test:smoke`) | 8 passed |
| Full Regression after Smoke (`npm run test:regression`) | 51 passed; 6 known date failures |

All six Regression failures are Alarms/Events From, To and same-day boundary
checks linked to [#8](https://github.com/skhomenko/powerside-testing-challenge/issues/8)
and [#17](https://github.com/skhomenko/powerside-testing-challenge/issues/17).
For this challenge, the assertions remain enabled to check intended behavior
and reproduce the reported defects. None were skipped or treated as successes;
the run returns a nonzero exit code. Full Regression in CI also recorded
51 passed and these 6 failures, with no pending or skipped tests. All other
Regression tests, including the API checks, passed. See
[automated coverage](test-cases.md#automated-coverage) for the scenarios and
their purpose.

## Security assessment and limits

Security checks covered protected API access and client logout using the supplied
Operator account. Role comparisons, server-side session revocation and formal API
contract coverage remain unverified. Test safeguards are described in the
[strategy](test-strategy.md#automated-scope-and-limits).

### Session revocation

**Unresolved security observation:** `POST /api/auth/logout` removed client access,
but replaying the issued cookie returned 200 from `/api/auth/me`. The expected
revocation policy is unknown. API-01 verifies client logout only; server-side
revocation remains unverified. This observation does not establish the backend
implementation or a confirmed policy violation.
