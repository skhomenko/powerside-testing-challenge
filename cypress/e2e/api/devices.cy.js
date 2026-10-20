import { apiLogin, cleanupApiSession, list, allDevices, protectApiDiagnostics, deviceState } from '../../support/api';
import { assertPage } from '../../support/pagination';

function verifyStableDevices(records, verify) {
  return allDevices().then(end => {
    if (!Cypress._.isEqual(deviceState(records), deviceState(end))) {
      throw new Error('DATA BLOCKER: device data changed during pagination/filter checks.');
    }
    verify();
  });
}

describe('API-03 | Device filtering and pagination', () => {
  beforeEach(() => { protectApiDiagnostics(); apiLogin(); });
  afterEach(function () {
    return cleanupApiSession(this.currentTest);
  });

  const statuses = ['Online', 'Warning', 'Offline'];
  for (const status of statuses) {
    it(`filters devices by ${status} with matching and nonmatching identities`, () => {
      allDevices().then(records => {
        const expected = records.filter(d => d.status === status);
        if (!expected.length || expected.length === records.length) {
          throw new Error(`DATA BLOCKER: require matching and nonmatching devices for ${status}.`);
        }
        if (expected.length > 100) throw new Error('DATA BLOCKER: status partition exceeds bounded page size.');
        return list('/api/devices', 'devices', { status, pageSize: 100, sort: 'name', order: 'asc' }).then(body =>
          verifyStableDevices(records, () => {
            expect(body.total, 'status total vs complete discovery').to.eq(expected.length);
            expect(body.devices.every(d => d.status === status), 'status matching witnesses').to.eq(true);
            expect(body.devices.map(d => d.id), 'exact status identities exclude nonmatches').to.have.members(expected.map(d => d.id));
          }));
      });
    });
  }

  it('preserves ordered identities across device page boundaries', () => {
    allDevices().then(records => {
      if (records.length <= 5) throw new Error('DATA BLOCKER: require more than five devices for pagination.');
      const pages = [];
      [1, 2].forEach(page => {
        list('/api/devices', 'devices', { page, pageSize: 5, sort: 'name', order: 'asc' }).then(body => {
          pages.push(body);
        });
      });
      verifyStableDevices(records, () => {
        pages.forEach((body, index) => assertPage(body, 'devices', records, 5, index + 1, 'name'));
        const identities = pages.flatMap(body => body.devices.map(d => d.id));
        expect(new Set(identities).size, 'no duplicate identities across pages').to.eq(identities.length);
      });
    });
  });
});
