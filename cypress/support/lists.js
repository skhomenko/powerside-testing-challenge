let requestSequence = 0;

export const paginationControls = {
  previous: 'button[aria-label="Go to previous page"]',
  next: 'button[aria-label="Go to next page"]',
};

export function select(id, text) {
  cy.get(`#${id}`).click();
  cy.contains('[role="option"]', new RegExp(`^${Cypress._.escapeRegExp(text)}$`)).click();
  cy.get(`#${id}`).should('have.text', text);
}

export function assertDeviceOptionsReady(id) {
  cy.get(`#${id}`).click();
  cy.get('[role="option"]').should($options => {
    expect($options.length, 'DATA BLOCKER: require loaded device options alongside All devices').to.be.greaterThan(1);
  });
  cy.get('body').type('{esc}');
  cy.get(`#${id}`).should('have.attr', 'aria-expanded', 'false');
}

export function pageSize(size) {
  cy.get('main').should($main => {
    expect(pageSizeControl($main), 'Rows per page control').to.have.length(1).and.be.visible;
  }).then($main => cy.wrap(pageSizeControl($main)).click());
  cy.contains('[role="option"]', new RegExp(`^${size}$`)).click();
}

function pageSizeControl($main) {
  return $main.find('[role="combobox"]').filter((index, control) =>
    (control.getAttribute('aria-labelledby') || '').split(/\s+/).some(id =>
      control.ownerDocument.getElementById(id)?.textContent.trim() === 'Rows per page:'));
}

// Match only the supplied query parameters; additional parameters are allowed.
export function actAndWaitForList(pathname, expectedQuery, action) {
  const alias = `listChange${++requestSequence}`;
  cy.intercept({ method: 'GET', pathname, query: Object.fromEntries(Object.entries(expectedQuery).filter(([, v]) => v !== '').map(([k, v]) => [k, String(v)])) }).as(alias);
  action();
  return cy.wait(`@${alias}`).then(({ response }) => {
    expect(response?.statusCode, 'list request status').to.eq(200);
    return response.body;
  });
}

export function cellByHeader($row, name) {
  const headers = [...$row.closest('table').find('thead th')];
  const matches = headers.map((header, index) => header.textContent.trim() === name ? index : -1).filter(index => index >= 0);
  expect(matches.length, `one column named ${name}`).to.eq(1);
  return cy.wrap($row).find('td').eq(matches[0]);
}

export function rowsMatch(selector, records, attribute) {
  cy.get(selector).should($rows => {
    expect([...$rows].map(row => Number(row.getAttribute(attribute))), 'rendered row identities').to.deep.eq(records.map(row => row.id));
  });
}

export function assertListLoaded({ tableLabel, headers, rows, emptyText }) {
  cy.get('main [data-cy="loading-spinner"]').should('not.exist');
  cy.get('main [role="alert"]').should('not.exist');
  return cy.get('main').should($main => {
    const $table = $main.find(`table[aria-label="${tableLabel}"]`);
    const $empty = $main.find('h2').filter((index, heading) => heading.textContent.trim() === emptyText);
    if ($empty.length) {
      expect($empty, 'empty state').to.be.visible;
      expect($main.find(rows).length, 'no rows in an empty list').to.eq(0);
      expect($table.length, 'table is hidden for an empty list').to.eq(0);
      return;
    }
    expect($table, 'list table').to.be.visible;
    expect([...$table.find('thead th')].map(header => header.textContent.trim()), 'table headers').to.deep.eq(headers);
    expect($table.find(rows).length, 'loaded rows').to.be.greaterThan(0);
    expect($main.find(paginationControls.previous), 'previous page control').to.be.visible;
    expect($main.find(paginationControls.next), 'next page control').to.be.visible;
    expect(pageSizeControl($main), 'Rows per page control').to.have.length(1).and.be.visible;
  });
}

export function readAll(pathname, key, query = {}, page = 1, collected = []) {
  return cy.request({ url: pathname, qs: { ...query, page, pageSize: 100 }, log: false }).then(({ status, body }) => {
    expect(status, 'discovery status').to.eq(200);
    expect(body[key], 'discovery collection').to.be.an('array');
    expect(body.total, 'discovery total').to.be.a('number');
    const records = collected.concat(body[key]);
    if (records.length < body.total) {
      if (page >= 50 || !body[key].length) throw new Error('DATA BLOCKER: discovery exceeded 50 pages or pagination stopped early.');
      return readAll(pathname, key, query, page + 1, records);
    }
    expect(new Set(records.map(row => row.id)).size, 'unique discovery records; data may have changed during paging').to.eq(records.length);
    return records;
  });
}

export function ordered(values, direction, numeric = false) {
  expect(values.length, 'DATA BLOCKER: at least two values required to check order').to.be.greaterThan(1);
  expect(new Set(values).size, 'DATA BLOCKER: differing values required to check order').to.be.greaterThan(1);
  const sorted = [...values].sort(numeric ? (a, b) => a - b : (a, b) => a.localeCompare(b));
  if (direction === 'desc') sorted.reverse();
  expect(values, `${direction} actual value order`).to.deep.eq(sorted);
}
