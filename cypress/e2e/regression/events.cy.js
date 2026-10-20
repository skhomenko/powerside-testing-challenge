import { events } from '../../support/pages/events';
import { actAndWaitForList, readAll, ordered } from '../../support/lists';
import { pagination, assertPage, assertOrderedSlice, assertPageCoverage } from '../../support/pagination';

const path = events.path;
const paging = pagination(path);
const chronologicalOrder = { sort: 'started_at', order: 'desc' };
const sagFilter = { type: 'Sag' };
const sagOrder = { ...sagFilter, sort: 'magnitude_pct', order: 'asc' };
const sagRecords = (records, order) => records.filter(row => row.type === 'Sag')
  .sort((a, b) => order === 'asc' ? a.magnitude_pct - b.magnitude_pct : b.magnitude_pct - a.magnitude_pct);
const allFilterFields = ['type', 'phase', 'category', 'itic', 'device'];

function matchesFields(row, sample, fields) {
  const matches = {
    type: row.type === sample.type,
    phase: row.phases.includes(sample.phases[0]),
    category: row.duration_category === sample.duration_category,
    itic: row.itic_status === sample.itic_status,
    device: row.device_id === sample.device_id,
  };
  return fields.every(field => matches[field]);
}

function findFilterExamples(records, fields) {
  const sample = records.find(candidate => {
    let remaining = records;
    return fields.every(field => {
      const matching = remaining.filter(row => matchesFields(row, candidate, [field]));
      const discriminates = matching.length > 0 && matching.length < remaining.length;
      remaining = matching;
      return discriminates;
    });
  });
  if (!sample) throw new Error('DATA BLOCKER: require matching and nonmatching events for every selected filter.');
  const values = {
    type: sample.type,
    phase: sample.phases[0],
    category: sample.duration_category,
    itic: sample.itic_status,
    device: { id: sample.device_id, name: sample.device_name },
  };
  return {
    filters: Object.fromEntries(fields.map(field => [field, values[field]])),
    expected: records.filter(row => matchesFields(row, sample, fields)),
  };
}

function findEmptyCombination(records) {
  for (const type of ['Sag', 'Swell', 'Interruption', 'RVC']) {
    const matchingType = records.filter(row => row.type === type);
    if (!matchingType.length) continue;
    for (const category of ['Instantaneous', 'Momentary', 'Temporary', 'Sustained']) {
      if (!matchingType.some(row => row.duration_category === category)) return { type, category };
    }
  }
  throw new Error('DATA BLOCKER: require an existing event type with an absent category combination.');
}

function assertSagPage(body, records, size, page) {
  const expected = assertPage(body, 'events', records, size, page, 'magnitude_pct');
  expect(body.events.every(row => row.type === 'Sag'), 'type filter remains applied').to.eq(true);
  events.assertRecords(expected);
  cy.get('#pq-type-filter').should('have.text', 'Sag');
}

describe('TC-04 | Events [Regression]', () => {
  let eventRecords;
  before(() => {
    cy.signIn();
    readAll(path, 'events', chronologicalOrder).then(records => { eventRecords = records; });
  });
  beforeEach(() => cy.signIn());

  describe('Filtering', () => {
    const filterCases = [
      { name: 'type', fields: ['type'] },
      { name: 'type and phase', fields: ['type', 'phase'] },
      { name: 'type, phase and category', fields: ['type', 'phase', 'category'] },
      { name: 'type, phase, category and ITIC', fields: ['type', 'phase', 'category', 'itic'] },
      { name: 'type, phase, category, ITIC and device', fields: allFilterFields },
    ];

    for (const { name, fields } of filterCases) {
      it(`filters events by ${name}`, () => {
        const records = eventRecords;
        const { filters, expected } = findFilterExamples(records, fields);
        events.visit();
        events.applyFilters(filters).then(body => {
          expect(body.total, 'combined filter total').to.eq(expected.length);
          events.assertRecords(assertOrderedSlice(body.events, expected, 0, events.defaultPageSize, 'started_at'));
        });
      });
    }

    it('clears all combined event filters', () => {
      const records = eventRecords;
      const { filters, expected } = findFilterExamples(records, allFilterFields);
      events.visit();
      events.applyFilters(filters).then(body => {
        expect(body.total).to.eq(expected.length);
        events.assertRecords(assertOrderedSlice(body.events, expected, 0, events.defaultPageSize, 'started_at'));
      });
      events.clearFilters().then(body => {
        expect(body.total).to.eq(records.length);
        events.assertRecords(assertOrderedSlice(body.events, records, 0, events.defaultPageSize, 'started_at'));
      });
    });

    it('recovers from an empty type and category combination', () => {
      const records = eventRecords;
      const { type, category } = findEmptyCombination(records);
      events.visit();
      events.applyFilters({ type }).then(body => {
        const expected = records.filter(row => row.type === type);
        expect(body.total).to.eq(expected.length);
        events.assertRecords(assertOrderedSlice(body.events, expected, 0, events.defaultPageSize, 'started_at'));
      });
      events.applyFilters({ category }, { type }).then(body => {
        expect(body.total).to.eq(0);
        events.assertRecords([]);
        events.assertLoaded();
      });
      events.clearFilters().then(body => {
        expect(body.total).to.eq(records.length);
        events.assertRecords(assertOrderedSlice(body.events, records, 0, events.defaultPageSize, 'started_at'));
      });
    });
  });

  describe('Sorting', () => {
    for (const order of ['asc', 'desc']) {
      it(`sorts Sag event magnitudes in ${order} numeric order`, () => {
        const records = sagRecords(eventRecords, order);
        events.visit();
        events.applyFilters(sagFilter);
        events.sortMagnitude(order, sagFilter).then(body => {
          const expected = assertOrderedSlice(body.events, records, 0, events.defaultPageSize, 'magnitude_pct');
          events.assertRecords(expected);
          ordered(body.events.map(row => row.magnitude_pct), order, true);
        });
      });
    }
  });

  describe('Pagination', () => {
    for (const size of [10, 25]) {
      it(`pages filtered Sag events forward and back at ${size} rows per page`, () => {
        const records = sagRecords(eventRecords, 'asc');
        if (records.length <= size) throw new Error(`DATA BLOCKER: require more than ${size} Sag events for pagination.`);
        let firstPageRecords;
        const scope = { ...sagOrder, pageSize: size };
        events.visit();
        events.applyFilters(sagFilter);
        events.sortMagnitude('asc', sagFilter);
        paging.setPageSize(size, sagOrder).then(body => {
          assertSagPage(body, records, size, 1);
          firstPageRecords = body.events;
          paging.assertPreviousDisabled();
        });
        paging.nextPage(2, scope).then(body => {
          assertSagPage(body, records, size, 2);
          assertPageCoverage([firstPageRecords, body.events], records, 'magnitude_pct');
        });
        paging.previousPage(1, scope).then(body => {
          assertSagPage(body, records, size, 1);
          paging.assertPreviousDisabled();
        });
      });
    }

    it('resets to the first filtered page when event page size changes', () => {
      const records = sagRecords(eventRecords, 'asc');
      if (records.length <= 10) throw new Error('DATA BLOCKER: require more than ten Sag events to start on page two.');
      events.visit();
      events.applyFilters(sagFilter);
      events.sortMagnitude('asc', sagFilter);
      let firstPageRecords;
      paging.setPageSize(10, sagOrder).then(body => {
        assertSagPage(body, records, 10, 1);
        firstPageRecords = body.events;
      });
      paging.nextPage(2, { ...sagOrder, pageSize: 10 }).then(body => {
        assertSagPage(body, records, 10, 2);
        assertPageCoverage([firstPageRecords, body.events], records, 'magnitude_pct');
      });
      paging.setPageSize(25, sagOrder).then(body => {
        assertSagPage(body, records, 25, 1);
        paging.assertPreviousDisabled();
      });
    });
  });

  describe('Navigation', () => {
    it('follows device View all and agrees between the selected event, details and device', () => {
      cy.request({ url: path, qs: { page: 1, pageSize: 1 }, log: false }).then(({ status, body }) => {
        expect(status, 'discovery status').to.eq(200);
        expect(body.events, 'discovery collection').to.be.an('array');
        if (!body.events.length) throw new Error('DATA BLOCKER: at least one event is required for navigation.');
        const device = body.events[0];
        cy.visit(`/devices/${device.device_id}`);
        cy.get('h1').should('have.text', device.device_name);
        actAndWaitForList(path, { deviceId: device.device_id }, () => cy.contains('button', /^View all \d+$/i).click()).then(body => {
          cy.get('#pq-device-filter').should('have.text', device.device_name);
          events.assertRecords(body.events);
          expect(body.events.every(row => row.device_id === device.device_id)).to.eq(true);
          const selected = body.events[0];
          cy.intercept('GET', `/api/pq-events/${selected.id}`).as('detail');
          cy.get(events.rows).first().click();
          cy.wait('@detail').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            ['id', 'device_id', 'type', 'started_at', 'magnitude_pct', 'duration_ms', 'duration_category', 'phases', 'itic_status'].forEach(key => {
              expect(response.body.event[key], `selected/detail ${key}`).to.deep.eq(selected[key]);
            });
          });
          events.assertDetail(selected);
          cy.contains('a', /^View device$/).click();
          cy.location('pathname').should('eq', `/devices/${selected.device_id}`);
          cy.get('h1').should('have.text', selected.device_name);
        });
      });
    });
  });
});
