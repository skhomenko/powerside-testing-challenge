import { alarms } from '../../support/pages/alarms';
import { actAndWaitForList, select, readAll } from '../../support/lists';
import { pagination, assertPage, assertOrderedSlice, assertPageCoverage } from '../../support/pagination';

const path = alarms.path;
const paging = pagination(path);

function resolvedExamples(records, { severity = false, device = false } = {}) {
  const sample = records.find(row => {
    const sameSeverity = records.filter(other => other.severity === row.severity);
    return (!severity || sameSeverity.length < records.length)
      && (!device || sameSeverity.some(other => other.device_id !== row.device_id));
  });
  if (!sample) throw new Error('DATA BLOCKER: require resolved alarms with matching and nonmatching examples for the selected filters.');
  return { records, sample };
}

function filterResolvedAlarms(sample, { severity = false, device = false } = {}) {
  const query = { status: 'Resolved' };
  let result = actAndWaitForList(path, query, () => select('alarm-status-filter', 'Resolved'));
  if (severity) {
    query.severity = sample.severity;
    result = actAndWaitForList(path, query, () => select('alarm-severity-filter', sample.severity));
  }
  if (device) {
    query.deviceId = sample.device_id;
    result = actAndWaitForList(path, query, () => select('alarm-device-filter', sample.device_name));
  }
  return result;
}

function assertResolvedPage(body, records, size, page) {
  const expected = assertPage(body, 'events', records, size, page, 'timestamp');
  expect(body.events.every(row => row.status === 'Resolved'), 'status filter remains applied').to.eq(true);
  alarms.assertRecords(expected);
  cy.get('#alarm-status-filter').should('have.text', 'Resolved');
}

describe('TC-05 | Alarms [Regression]', () => {
  let resolvedRecords;
  before(() => {
    cy.signIn();
    readAll(path, 'events', { status: 'Resolved' }).then(records => { resolvedRecords = records; });
  });
  beforeEach(() => cy.signIn());

  const filterCases = [
    { name: 'status' },
    { name: 'status and severity', severity: true },
    { name: 'status, severity and device', severity: true, device: true },
  ];

  for (const filters of filterCases) {
    it(`filters alarms by ${filters.name}`, () => {
      const { records, sample } = resolvedExamples(resolvedRecords, filters);
      const expected = records.filter(row => (!filters.severity || row.severity === sample.severity)
        && (!filters.device || row.device_id === sample.device_id));

      alarms.visit().then(body => {
        expect(body.events.some(row => row.status !== 'Resolved'), 'DATA BLOCKER: require nonmatching status examples').to.eq(true);
      });
      filterResolvedAlarms(sample, filters).then(body => {
        expect(body.total, 'matching alarm count').to.eq(expected.length);
        alarms.assertRecords(assertOrderedSlice(body.events, expected, 0, 15, 'timestamp'));
      });
    });
  }

  it('expands resolved alarm details and collapses them', () => {
    alarms.visit();
    actAndWaitForList(path, { status: 'Resolved' }, () => select('alarm-status-filter', 'Resolved')).then(body => {
      if (!body.events.length) throw new Error('DATA BLOCKER: require a resolved alarm for details.');
      alarms.assertActions('Resolved');
      alarms.expand(body.events[0]);
      cy.get('[data-cy="expand-row"][aria-expanded="true"]').click().should('have.attr', 'aria-expanded', 'false');
      cy.get('[data-cy="alarm-detail"]').should('not.exist');
    });
  });

  it('clears combined filters and recovers from an empty result', () => {
    const { sample } = resolvedExamples(resolvedRecords);
    alarms.visit();
    filterResolvedAlarms(sample, { severity: true, device: true });

    // This future window checks empty-state recovery, not date correctness.
    const day = `${new Date().getFullYear() + 10}-01-01`;
    actAndWaitForList(path, { from: day }, () => cy.get('#alarm-from-date').type(day)).then(body => {
      expect(body.total).to.eq(0);
      cy.contains('No alarms match your filters').should('be.visible');
      alarms.assertLoaded();
    });
    actAndWaitForList(path, { deviceId: 'All', severity: 'All', status: 'All' }, () => cy.contains('button', /^Clear$/).click()).then(body => {
      expect(body.total).to.be.greaterThan(0);
      alarms.assertRecords(body.events);
      ['status', 'severity'].forEach(filter => cy.get(`#alarm-${filter}-filter`).should('have.text', 'All'));
      cy.get('#alarm-device-filter').should('have.text', 'All devices');
      cy.get('#alarm-from-date').should('have.value', '');
    });
  });

  for (const size of [10, 25]) {
    it(`pages resolved alarms forward and back at ${size} rows per page`, () => {
      const records = resolvedRecords;
      if (records.length <= size) throw new Error(`DATA BLOCKER: require more than ${size} resolved alarms for pagination.`);
      let firstPageRecords;
      alarms.visit();
      actAndWaitForList(path, { status: 'Resolved' }, () => select('alarm-status-filter', 'Resolved'));

      paging.setPageSize(size, { status: 'Resolved' }).then(body => {
        assertResolvedPage(body, records, size, 1);
        firstPageRecords = body.events;
        paging.assertPreviousDisabled();
      });
      paging.nextPage(2, { status: 'Resolved', pageSize: size }).then(body => {
        assertResolvedPage(body, records, size, 2);
        assertPageCoverage([firstPageRecords, body.events], records, 'timestamp');
        paging.assertPreviousDisabled(false);
      });
      paging.previousPage(1, { status: 'Resolved', pageSize: size }).then(body => {
        assertResolvedPage(body, records, size, 1);
        paging.assertPreviousDisabled();
      });
    });
  }

  it('resets to the first page and preserves the status filter when page size changes', () => {
    const records = resolvedRecords;
    if (records.length <= 10) throw new Error('DATA BLOCKER: require more than ten resolved alarms to start on page two.');
    alarms.visit();
    actAndWaitForList(path, { status: 'Resolved' }, () => select('alarm-status-filter', 'Resolved'));
    let firstPageRecords;
    paging.setPageSize(10, { status: 'Resolved' }).then(body => {
      assertResolvedPage(body, records, 10, 1);
      firstPageRecords = body.events;
    });
    paging.nextPage(2, { status: 'Resolved', pageSize: 10 }).then(body => {
      assertResolvedPage(body, records, 10, 2);
      assertPageCoverage([firstPageRecords, body.events], records, 'timestamp');
    });
    paging.setPageSize(25, { status: 'Resolved' }).then(body => {
      assertResolvedPage(body, records, 25, 1);
      paging.assertPreviousDisabled();
    });
  });

  it('shows the read-only action availability matrix without submitting actions', () => {
    alarms.visit();
    ['Active', 'Acknowledged', 'Resolved'].forEach(status => {
      actAndWaitForList(path, { status }, () => select('alarm-status-filter', status)).then(body => {
        if (!body.events.length) throw new Error(`DATA BLOCKER: no ${status} alarm available for the action matrix.`);
        expect(body.events.every(row => row.status === status)).to.eq(true);
        alarms.assertRecords(body.events);
        alarms.assertActions(status);
      });
    });
  });
});
