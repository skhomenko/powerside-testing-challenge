import { actAndWaitForList, rowsMatch, assertListLoaded, cellByHeader, assertDeviceOptionsReady } from '../lists';

export const alarms = {
  path: '/api/events',
  rows: '[data-cy="alarm-row"]',
  visit() {
    return actAndWaitForList(this.path, { page: 1, pageSize: 15 }, () => cy.visit('/alarms')).then(body => {
      this.assertRecords(body.events);
      return cy.then(() => body);
    });
  },
  assertLoaded() {
    cy.get('h1').should('be.visible').and('have.text', 'Alarms');
    ['severity', 'status', 'device'].forEach(filter => cy.get(`#alarm-${filter}-filter`).should('be.visible'));
    assertDeviceOptionsReady('alarm-device-filter');
    ['from', 'to'].forEach(boundary => cy.get(`#alarm-${boundary}-date`).should('be.visible'));
    cy.contains('button', /^Clear$/).should('be.visible');
    assertListLoaded({
      tableLabel: 'Alarms across all devices',
      headers: ['', '', 'Time', 'Device', 'Severity', 'Status', 'Measurement', 'Actions'],
      rows: this.rows,
      emptyText: 'No alarms match your filters',
    });
  },
  assertRecords(records) {
    if (!records.length) {
      cy.get(this.rows).should('not.exist');
      cy.contains('h2', /^No alarms match your filters$/).should('be.visible');
      return;
    }
    rowsMatch(this.rows, records, 'data-alarm-id');
    cy.get(this.rows).each(($row, i) => {
      const record = records[i];
      Object.entries({ Device: record.device_name, Severity: record.severity, Status: record.status }).forEach(([column, value]) => {
        cellByHeader($row, column).should('have.text', value);
      });
    });
  },
  assertActions(status, records) {
    rowsMatch(this.rows, records, 'data-alarm-id');
    for (const record of records) {
      const row = `${this.rows}[data-alarm-id="${record.id}"]`;
      cy.get(row).find('[data-cy="ack-button"]').should(status === 'Active' ? 'be.enabled' : 'be.disabled');
      cy.get(row).find('[data-cy="resolve-button"]').should(status === 'Resolved' ? 'be.disabled' : 'be.enabled');
      cy.get(row).find('input[type="checkbox"]').should(status === 'Active' ? 'be.enabled' : 'be.disabled');
    }
  },
  expand(record) {
    cy.get(`${this.rows}[data-alarm-id="${record.id}"] [data-cy="expand-row"]`).click().should('have.attr', 'aria-expanded', 'true');
    cy.get('[data-cy="alarm-detail"]').should('be.visible').and('contain', record.message);
    ['Threshold', 'Actual value', 'Location'].forEach((label, index) => {
      const value = [record.threshold_value, record.actual_value, record.device_location][index];
      cy.contains('[data-cy="alarm-detail"] *', new RegExp(`^${label}$`)).next('p').invoke('text').should('match', new RegExp(`^${Cypress._.escapeRegExp(String(value))}(?:%|V|A|Hz)?$`));
    });
    cy.get(`${this.rows}[data-alarm-id="${record.id}"]`).then($row => cellByHeader($row, 'Measurement').invoke('text')).then(measurement => {
      cy.contains('[data-cy="alarm-detail"] *', /^Breached measurement$/).next('p').should('have.text', measurement);
    });
  },
};
