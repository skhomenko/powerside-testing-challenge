import { actAndWaitForList, select, rowsMatch, assertListLoaded, cellByHeader, assertDeviceOptionsReady } from '../lists';

const allFilters = { type: 'All', category: 'All', phase: 'All', itic: 'All', deviceId: 'All' };

export const events = {
  path: '/api/pq-events',
  rows: '[data-cy="pq-event-row"]',
  defaultPageSize: 15,
  visit() {
    return actAndWaitForList(this.path, { page: 1, pageSize: this.defaultPageSize }, () => cy.visit('/events')).then(body => {
      this.assertRecords(body.events);
      return cy.then(() => body);
    });
  },
  applyFilters(filters, currentFilters = {}) {
    const query = { page: 1 };
    for (const [field, value] of Object.entries(currentFilters)) {
      query[field === 'device' ? 'deviceId' : field] = field === 'device' ? value.id : value;
    }
    let result;
    for (const [field, value] of Object.entries(filters)) {
      query[field === 'device' ? 'deviceId' : field] = field === 'device' ? value.id : value;
      const label = field === 'device' ? value.name : value;
      result = actAndWaitForList(this.path, query, () => select(`pq-${field}-filter`, label));
    }
    return result;
  },
  clearFilters() {
    return actAndWaitForList(this.path, allFilters, () => cy.contains('button', /^Clear filters$/).first().click());
  },
  sortMagnitude(order, filters = {}) {
    const clickMagnitude = () => cy.contains('th [role="button"]', /^Magnitude$/).click();
    let result = actAndWaitForList(this.path, { ...filters, sort: 'magnitude_pct', order: 'desc' }, clickMagnitude);
    if (order === 'asc') result = actAndWaitForList(this.path, { ...filters, sort: 'magnitude_pct', order }, clickMagnitude);
    return result;
  },
  assertLoaded() {
    cy.get('h1').should('be.visible').and('have.text', 'Power quality events');
    ['type', 'category', 'phase', 'itic', 'device'].forEach(filter => cy.get(`#pq-${filter}-filter`).should('be.visible'));
    assertDeviceOptionsReady('pq-device-filter');
    ['from', 'to'].forEach(boundary => cy.get(`#pq-${boundary}-date`).should('be.visible'));
    cy.contains('button', /^Clear filters$/).should('be.visible');
    cy.contains('h2', /^ITIC compliance$/).should('be.visible');
    cy.get('main').should($main => {
      const $chart = $main.find('h2').filter((index, heading) => heading.textContent.trim() === 'ITIC compliance').parent();
      if ($main.find(this.rows).length) expect($chart.find('svg.recharts-surface'), 'ITIC chart').to.be.visible;
      else expect($chart, 'empty chart state').to.contain('No events to plot for the current filters.');
    });
    assertListLoaded({
      tableLabel: 'Power quality events',
      headers: ['Start time', 'Device', 'Type', 'Magnitude', 'Duration', 'Category', 'Phases', 'ITIC'],
      rows: this.rows,
      emptyText: 'No power quality events match your filters',
    });
  },
  assertRecords(records) {
    if (!records.length) {
      cy.get(this.rows).should('not.exist');
      cy.contains('h2', /^No power quality events match your filters$/).should('be.visible');
      return;
    }
    rowsMatch(this.rows, records, 'data-event-id');
    cy.get(this.rows).each(($row, i) => {
      const record = records[i];
      const values = { Device: record.device_name, Type: record.type, Magnitude: `${record.magnitude_pct}%`, Category: record.duration_category, Phases: record.phases.join(', '), ITIC: record.itic_status };
      Object.entries(values).forEach(([column, value]) => cellByHeader($row, column).should('have.text', value));
    });
  },
  assertDetail(record) {
    cy.location('pathname').should('eq', `/events/${record.id}`);
    cy.get('h1').should('have.text', `${record.type} on ${record.device_name}`);
    const cards = { Magnitude: record.magnitude_pct.toFixed(1), Category: record.duration_category, 'Affected phases': record.phases.join(', '), 'ITIC result': record.itic_status };
    Object.entries(cards).forEach(([label, value]) => {
      cy.contains('h3', new RegExp(`^${label}$`)).next().find('p').first().should('have.text', value);
    });
    cy.contains('h2', 'RMS voltage through the disturbance').should('be.visible');
    cy.get('main svg.recharts-surface').should('be.visible');
  },
};
