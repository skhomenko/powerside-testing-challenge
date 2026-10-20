# Application inventory

[Power Quality Monitor](https://testapp.andresfloresv.com) provides device readings, power-quality events and threshold alarms.

## Features

| Area | What it provides |
| --- | --- |
| Login | Username and password authentication, required-field validation, invalid-credential feedback and logout. Sessions support reload, browser restart, shared tabs, an inactivity warning and Stay signed in. |
| Dashboard | Device and alarm summary counts, a live three-phase voltage chart, recent alarms, update information and links to devices and full lists. |
| Devices | Search by name or location, a Status filter, sorting, pagination and device details. Offline and filtered-empty states have separate messages. |
| Device details | Current readings, voltage history, chart ranges, Voltage and Current harmonic views, recent power-quality events, alarm history and editable settings. |
| Events | Filters for type, duration category, phase, ITIC, device and dates; sorting, pagination and an ITIC scatter chart. Details include measurements, an RMS chart and links to Events and the device. |
| Alarms | Severity, status, device and date filters; expandable details, selection and pagination. Individual Acknowledge and Resolve controls, plus bulk Acknowledge selected. Device alarm history also has a measurement filter. |

The nine editable settings are name, location, minimum and maximum voltage, maximum current, maximum THD-V, maximum THD-I, minimum power factor and frequency tolerance. Measurement limits are used for alarms; readings and chart values are not editable settings.

## Relationships

Dashboard links lead to devices and full lists. Each device brings together its readings, settings, events and alarm history. Device View all opens Events with that device selected; an event links back to its device.

Device status describes reporting condition. Alarm status describes handling, such as Active, Acknowledged or Resolved; severity describes importance. Power-quality events and threshold alarms are separate records. Events has no severity filter.

The application's What's new dialog describes bulk acknowledgement and longer chart ranges. The inventory records the available controls; executed behavior and coverage gaps are recorded in the test results.

## Open questions

Product questions cover [mobile support](https://github.com/skhomenko/powerside-testing-challenge/issues/2), [password recovery](https://github.com/skhomenko/powerside-testing-challenge/issues/11), [account provisioning](https://github.com/skhomenko/powerside-testing-challenge/issues/12) and [Terms and Privacy information](https://github.com/skhomenko/powerside-testing-challenge/issues/13). Supported browsers, date and timezone rules and the meaning of "out of spec" also need clarification.

## Published findings

| Type | Count | Issues |
| --- | --- | --- |
| Bugs | 5 | [Keyboard navigation](https://github.com/skhomenko/powerside-testing-challenge/issues/3), [harmonic chart label](https://github.com/skhomenko/powerside-testing-challenge/issues/5), [To filter](https://github.com/skhomenko/powerside-testing-challenge/issues/8), [From filter](https://github.com/skhomenko/powerside-testing-challenge/issues/17), [event Category clipping](https://github.com/skhomenko/powerside-testing-challenge/issues/18) |
| Improvements | 8 | [Published improvements](https://github.com/skhomenko/powerside-testing-challenge/issues?q=is%3Aissue%20label%3Aenhancement) |
| Questions | 4 | [Published questions](https://github.com/skhomenko/powerside-testing-challenge/issues?q=is%3Aissue%20label%3Aquestion) |
