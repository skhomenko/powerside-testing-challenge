# Manual test report

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

No security issues were found. Backend authorization and session revocation were not tested.

Manual checks were performed on 19 October 2026 using an Operator account at [Power Quality Monitor](https://testapp.andresfloresv.com). Recorded viewports were 1440 x 900, 390 x 844 and 320 x 568. The harmonic-label check also used 1690 x 900.

TC-02 was rerun on the same date at 1280 x 720.

This report preserves the manual observations and limits from those sessions.
The current suite is defined in [test-cases.md](test-cases.md). Automated
execution results are generated separately as described in the
[README](../README.md#run-the-tests).

## Initial manual checks

### TC-01: Login and logout

**Execution:** Required fields, invalid-login recovery, reload and sampled logout navigation worked. Direct device and Alarms URLs returned to Login.

**Not covered yet:** A complete rerun of this case with controlled test data.

### TC-02: Dashboard loading and device link

**Execution:** Passed in the manual rerun. All four summary cards, Recent alarms and the Live voltage chart loaded without a displayed error. One device link from Recent alarms was opened, and the destination page showed exactly the same device name.

### TC-03: Device search, filters and pagination

**Execution:** Offline returned 2 devices in the observed dataset; All restored the list. Partial-name search and no-match recovery worked. Name descending and the final-page Next boundary were checked.

**Not covered yet:** Location search, combined search and status, other sorting and page-size combinations.

### TC-04: Events and device links

**Execution:** Device navigation, Sag and Swell filters, event details and empty-state recovery were sampled. Category = Sustained, Phase = L1 and ITIC = Fail returned no results. Pagination moved from rows 1-15 to 16-30; selecting 25 displayed 25 rows. Magnitude showed a descending sort state.

**Not covered yet:** Numeric Magnitude order, other combinations, return-state behavior and a retest of published [Category clipping](https://github.com/skhomenko/powerside-testing-challenge/issues/18).

### TC-05: Alarm filters and details

**Execution:** Critical plus Resolved displayed matching values; All restored results. Sampled handled rows had no enabled Acknowledge or Resolve actions. Details showed expanded state. The sampled Active-filter page contained Active alarms.

**Not covered yet:** Device filtering, pagination correctness, the complete action matrix and whether alarm sorting is supported.

### TC-06: From and To dates

**Execution:** From included records displayed on the previous day. To omitted late-evening records that appeared when To advanced one day and disappeared when it was restored. Both failures were observed on Alarms and Events. A same-day Alarms range returned results.

**Not covered yet:** Complete midnight, timezone and combined-boundary coverage. The exact cutoff and cause remain unknown.

### TC-07: Device settings

**Execution:** The full edit, reset and save flow was checked, including updated name and location at the top of the device page. All 9 original settings matched after restoration and reload; Save and Reset changes were disabled. Selected validation checks were completed.

**Not covered yet:** Updates in Devices and other pages, complete server validation, concurrent edits and effects on alarms.

### TC-08: Individual Acknowledge and Resolve

**Execution:** One alarm was acknowledged and then resolved. Both status changes showed in the UI. After Resolve, its Acknowledge and Resolve buttons were disabled.

**Not covered yet:** Reload, device history and Dashboard counts after the change. Resolve without acknowledging first, and repeated actions.

### TC-09: Bulk acknowledgement

**Execution:** Select all active on page exposed Acknowledge selected and Clear selection; deselection cleared it.

**Not covered yet:** Submission, handling already-acknowledged records, selection after filter or page changes and partial success.

### TC-10: Restart, tabs and inactivity

**Execution:** Restart retained login. The second tab returned to Login on reload after logout. Inactivity showed a warning; Stay signed in extended access, and waiting without extension logged out.

**Not covered yet:** Exact timing, keyboard use and backend revocation. Release notes state a 10-minute timeout and one-minute warning; these timings have not been measured.

## Follow-up manual checks

The implementation follow-up added these observations on 19 October 2026,
using the existing Operator account and displayed calendar dates. Its interactive
viewport was not measured. Automated run metadata is recorded in the generated
reports described in the
[README](../README.md#run-the-tests).

| ID | Additional executed checks | Result and limit |
| --- | --- | --- |
| TC-01 | Log out, directly open Alarms, sign in again and reload the protected page. | Protected navigation returned to Login; valid sign-in returned to the requested page and reload retained access. Invalid credentials were not retried because the account lockout policy remains unconfirmed. |
| TC-02 | Inspect Dashboard sections and follow a Recent alarms device link. | All four summary headings, Live voltage and Recent alarms appeared. The selected device name exactly matched the destination heading. |
| TC-03 | Search a shared location, then combine it with Online status. | The location initially showed mixed statuses. Online removed the Warning row and retained the two matching Online rows. Ordering and identity checks are covered by the automated suite. |
| TC-04 | Check displayed Magnitude values in both sort directions; sample a type filter; follow device View all, open an event and return through View device. | Sampled magnitudes were numerically ordered. List and detail agreed on device, type, magnitude, category, phases and ITIC result. Full Category clipping was not visually reassessed. |
| TC-05 | Combine Resolved, Critical and a device; inspect expansion; reset and navigate pages. | Sampled rows matched the three filters. Expanded measurement, threshold, actual value and location were present; Resolved actions were disabled. No action was submitted. Pagination identities and the action matrix are covered by the automated suite. |
| TC-06 | Compare a same-day alarm range and move To forward/back; check Events From alone and To forward/back. | Alarms included the preceding displayed day and omitted late evening on the selected day. Events From included a preceding-day late record. Advancing To restored the late Events record; restoring To removed it. Known defects remain reproduced. |
