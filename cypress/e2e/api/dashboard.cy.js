import { apiLogin, cleanupApiSession, get, list, allDevices, protectApiDiagnostics, deviceState } from '../../support/api';

const severities = ['Critical', 'Warning', 'Info'];

function assertCount(value, label) {
  expect(typeof value, `${label} type`).to.eq('number');
  expect(Number.isSafeInteger(value), `${label} must be an integer`).to.eq(true);
  expect(value, `${label} must be nonnegative`).to.be.at.least(0);
}

function readSummary() {
  return get('/api/dashboard/summary').then(summary => {
    ['totalDevices', 'offlineDevices', 'activeAlarms', 'devicesOutOfSpec'].forEach(field => {
      assertCount(summary[field], `Dashboard ${field}`);
    });
    severities.forEach(severity => assertCount(summary.activeBySeverity?.[severity], `Dashboard ${severity}`));
    return summary;
  });
}

function readDevices() {
  return allDevices().then(devices => {
    if (!devices.length) throw new Error('DATA BLOCKER: require devices for reconciliation.');
    if (devices.length > 100) throw new Error('DATA BLOCKER: per-device reconciliation is limited to 100 devices.');
    devices.forEach((device, index) => {
      assertCount(device.id, `Device row ${index + 1} identity`);
      expect(device.status, `Device ${device.id} status`).to.be.oneOf(['Online', 'Warning', 'Offline']);
      assertCount(device.active_alarms, `Device ${device.id} active alarms`);
    });
    return devices;
  });
}

function countActiveBySeverity() {
  const counts = {};
  return cy.wrap(severities, { log: false }).each(severity => {
    return list('/api/events', 'events', { status: 'Active', severity }).then(({ events, total }) => {
      events.forEach((event, index) => {
        expect(event.status, `${severity} alarm row ${index + 1} status`).to.eq('Active');
        expect(event.severity, `${severity} alarm row ${index + 1} severity`).to.eq(severity);
      });
      // A zero total is valid; list() also verifies that the returned page is empty.
      counts[severity] = total;
    });
  }).then(() => counts);
}

function countActiveByDevice(devices) {
  const counts = {};
  return cy.wrap(devices, { log: false }).each(device => {
    return list('/api/events', 'events', { status: 'Active', deviceId: device.id }).then(({ events, total }) => {
      events.forEach((event, index) => {
        expect(event.device_id, `Device ${device.id} alarm row ${index + 1} device`).to.eq(device.id);
        expect(event.status, `Device ${device.id} alarm row ${index + 1} status`).to.eq('Active');
      });
      counts[device.id] = total;
    });
  }).then(() => counts);
}

function readSnapshot() {
  return readSummary()
    .then(summary => readDevices().then(devices => ({ summary, devices })))
    .then(snapshot => list('/api/events', 'events', { status: 'Active' })
      .then(({ total }) => ({ ...snapshot, active: total })))
    .then(snapshot => countActiveBySeverity()
      .then(severity => ({ ...snapshot, severity })))
    .then(snapshot => countActiveByDevice(snapshot.devices)
      .then(byDevice => ({ ...snapshot, byDevice })));
}

function assertReconciliation({ summary, devices, active, severity, byDevice }) {
  const offline = devices.filter(device => device.status === 'Offline').length;
  const outOfSpec = devices.filter(device => byDevice[device.id] > 0).length;
  const deviceTotal = devices.reduce((sum, device) => sum + device.active_alarms, 0);
  const severityTotal = Object.values(severity).reduce((sum, count) => sum + count, 0);

  expect(summary.totalDevices, 'Dashboard total vs complete device list').to.eq(devices.length);
  expect(summary.offlineDevices, 'Dashboard offline vs device statuses').to.eq(offline);
  devices.forEach(device => {
    expect(device.active_alarms, `Device ${device.id} count vs filtered alarm total`).to.eq(byDevice[device.id]);
  });
  expect(summary.activeAlarms, 'Dashboard active vs alarm pagination total').to.eq(active);
  expect(summary.activeAlarms, 'Dashboard active vs sum of device counts').to.eq(deviceTotal);
  expect(summary.devicesOutOfSpec, 'Distinct devices with Active alarms').to.eq(outOfSpec);
  severities.forEach(name => {
    expect(summary.activeBySeverity[name], `Dashboard ${name} vs filtered alarm total`).to.eq(severity[name]);
  });
  expect(active, 'All Active severities accounted for').to.eq(severityTotal);
}

function reconcile(attempt = 0) {
  return readSnapshot().then(snapshot => {
    return readDevices().then(endDevices => readSummary().then(endSummary => {
      const stable = Cypress._.isEqual(snapshot.summary, endSummary)
        && Cypress._.isEqual(deviceState(snapshot.devices), deviceState(endDevices));
      if (!stable) {
        if (!attempt) return reconcile(1);
        throw new Error('DATA BLOCKER: monitoring counts changed in both bounded reconciliation attempts.');
      }
      assertReconciliation(snapshot);
    }));
  });
}

describe('API-02 | Dashboard reconciliation', () => {
  beforeEach(() => { protectApiDiagnostics(); apiLogin(); });
  afterEach(function () {
    return cleanupApiSession(this.currentTest);
  });
  it('reconciles device, Active alarm and severity totals across independent endpoints', () => reconcile());
});
