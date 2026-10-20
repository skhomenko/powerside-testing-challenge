import { devices } from '../../support/pages/devices';
import { actAndWaitForList, select, readAll, ordered } from '../../support/lists';
import { pagination, assertPage, assertOrderedSlice, assertPageCoverage } from '../../support/pagination';

const path = devices.path;
const paging = pagination(path);
const nameOrder = { sort: 'name', order: 'asc' };
const matchesSearch = (row, query) => [row.name, row.location].some(value => value.toLowerCase().includes(query.toLowerCase()));

function searchExample(records, field, withStatus) {
  for (const sample of records) {
    const value = sample[field];
    const queries = [value, ...value.split(/\s+/).filter(word => word.length >= 2), value.slice(0, 3)];
    for (const query of queries) {
      const matching = records.filter(row => matchesSearch(row, query));
      if (matching.length < records.length && matching.length > 0
        && (!withStatus || matching.some(row => row.status !== sample.status))) {
        return { sample, query, matching };
      }
    }
  }
  throw new Error(`DATA BLOCKER: require a ${field} search with matching and nonmatching examples${withStatus ? ' across statuses' : ''}.`);
}

function sortNames(order) {
  const clickName = () => cy.contains('th [role="button"]', /^Name$/).click();
  let result = actAndWaitForList(path, { sort: 'name', order: 'desc' }, clickName);
  if (order === 'asc') result = actAndWaitForList(path, nameOrder, clickName);
  return result;
}

function assertDevicePage(body, records, size, page) {
  const expected = assertPage(body, 'devices', records, size, page, 'name');
  devices.assertRecords(expected);
}

describe('TC-03 | Devices [Regression]', () => {
  let deviceRecords;
  before(() => {
    cy.signIn();
    readAll(path, 'devices', nameOrder).then(records => { deviceRecords = records; });
  });
  beforeEach(() => cy.signIn());

  const searchCases = [
    { field: 'name', withStatus: false },
    { field: 'name', withStatus: true },
    { field: 'location', withStatus: false },
    { field: 'location', withStatus: true },
  ];

  for (const { field, withStatus } of searchCases) {
    it(`searches by ${field}${withStatus ? ' combined with status' : ''}`, () => {
      const records = deviceRecords;
      const { sample, query, matching } = searchExample(records, field, withStatus);
      const expected = matching.filter(row => !withStatus || row.status === sample.status);
      devices.visit();
      if (withStatus) actAndWaitForList(path, { status: sample.status }, () => select('device-status-filter', sample.status));
      devices.search(query, withStatus ? sample.status : 'All').then(body => {
        expect(body.total, 'matching device count').to.eq(expected.length);
        devices.assertRecords(assertOrderedSlice(body.devices, expected, 0, 10, 'name'));
      });
    });
  }

  it('recovers from an empty search and clears the status filter', () => {
    const records = deviceRecords;
    if (!records.length) throw new Error('DATA BLOCKER: require a device for search recovery.');
    const status = records[0].status;
    devices.visit();
    actAndWaitForList(path, { status }, () => select('device-status-filter', status));
    devices.search(`no-device-${Date.now()}`, status).then(body => {
      expect(body.total).to.eq(0);
      cy.contains('No devices match your filters').should('be.visible');
      devices.assertLoaded();
    });
    devices.search('', status).then(body => {
      const expected = records.filter(row => row.status === status);
      expect(body.total).to.eq(expected.length);
      devices.assertRecords(assertOrderedSlice(body.devices, expected, 0, 10, 'name'));
    });
    actAndWaitForList(path, { status: 'All', search: '' }, () => select('device-status-filter', 'All')).then(body => {
      expect(body.total).to.eq(records.length);
      devices.assertRecords(assertOrderedSlice(body.devices, records, 0, 10, 'name'));
    });
  });

  for (const order of ['asc', 'desc']) {
    it(`sorts device names in ${order} order`, () => {
      const records = order === 'asc' ? deviceRecords : [...deviceRecords].reverse();
      devices.visit();
      sortNames(order).then(body => {
        devices.assertRecords(assertOrderedSlice(body.devices, records, 0, 10, 'name'));
        ordered(body.devices.map(row => row.name), order);
      });
    });
  }

  for (const size of [5, 10]) {
    it(`pages devices forward and back at ${size} rows per page`, () => {
      const records = deviceRecords;
      if (records.length <= size) throw new Error(`DATA BLOCKER: require more than ${size} devices for pagination.`);
      let firstPageRecords;
      let firstPage = devices.visit();
      if (size !== 10) firstPage = paging.setPageSize(size, { ...nameOrder });
      firstPage.then(body => {
        assertDevicePage(body, records, size, 1);
        firstPageRecords = body.devices;
        paging.assertPreviousDisabled();
      });
      paging.nextPage(2, { ...nameOrder, pageSize: size }).then(body => {
        assertDevicePage(body, records, size, 2);
        assertPageCoverage([firstPageRecords, body.devices], records, 'name');
      });
      paging.previousPage(1, { ...nameOrder, pageSize: size }).then(body => {
        assertDevicePage(body, records, size, 1);
        paging.assertPreviousDisabled();
      });
    });
  }

  it('resets to the first page when the device page size changes', () => {
    const records = deviceRecords;
    if (records.length <= 5) throw new Error('DATA BLOCKER: require more than five devices to start on page two.');
    devices.visit();
    let firstPageRecords;
    paging.setPageSize(5, nameOrder).then(body => {
      assertDevicePage(body, records, 5, 1);
      firstPageRecords = body.devices;
    });
    paging.nextPage(2, { ...nameOrder, pageSize: 5 }).then(body => {
      assertDevicePage(body, records, 5, 2);
      assertPageCoverage([firstPageRecords, body.devices], records, 'name');
    });
    paging.setPageSize(25, { ...nameOrder }).then(body => {
      assertDevicePage(body, records, 25, 1);
      paging.assertPreviousDisabled();
    });
  });

  it('opens the selected device row', () => {
    devices.visit().then(body => {
      if (!body.devices.length) throw new Error('DATA BLOCKER: require a device for row navigation.');
      const selected = body.devices[0];
      cy.get(devices.rows).first().click();
      cy.get('h1').should('have.text', selected.name);
      cy.location('pathname').should('eq', `/devices/${selected.id}`);
    });
  });
});
