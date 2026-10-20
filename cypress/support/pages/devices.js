import { actAndWaitForList, rowsMatch, assertListLoaded, cellByHeader } from '../lists';

export const devices = {
  path: '/api/devices',
  rows: '[data-cy="device-row"]',
  visit() {
    return actAndWaitForList(this.path, { page: 1, pageSize: 10 }, () => cy.visit('/devices')).then(body => {
      this.assertRecords(body.devices);
      return cy.then(() => body);
    });
  },
  assertLoaded() {
    cy.get('h1').should('be.visible').and('have.text', 'Devices');
    cy.get('#device-search').should('be.visible');
    cy.get('#device-status-filter').should('be.visible');
    assertListLoaded({
      tableLabel: 'Monitored devices',
      headers: ['Name', 'Location', 'Status', 'Active alarms', 'Last reading'],
      rows: this.rows,
      emptyText: 'No devices match your filters',
    });
  },
  search(value, status = 'All') {
    return actAndWaitForList(this.path, { search: value, status }, () => {
      cy.get('#device-search').clear();
      if (value) cy.get('#device-search').type(value, { parseSpecialCharSequences: false });
    });
  },
  assertRecords(records) {
    if (!records.length) {
      cy.get(this.rows).should('not.exist');
      cy.contains('h2', /^No devices match your filters$/).should('be.visible');
      return;
    }
    rowsMatch(this.rows, records, 'data-device-id');
    cy.get(this.rows).each(($row, i) => {
      const record = records[i];
      Object.entries({ Name: record.name, Location: record.location, Status: record.status }).forEach(([column, value]) => {
        cellByHeader($row, column).should('have.text', value);
      });
    });
  },
};
