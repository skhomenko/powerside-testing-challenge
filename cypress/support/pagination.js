import { actAndWaitForList, pageSize, paginationControls } from './lists';

export function pagination(path) {
  return {
    setPageSize(size, expectedQuery = {}) {
      return actAndWaitForList(path, { ...expectedQuery, page: 1, pageSize: size }, () => pageSize(size));
    },
    nextPage(page, expectedQuery = {}) {
      return actAndWaitForList(path, { ...expectedQuery, page }, () => cy.get(paginationControls.next).click());
    },
    previousPage(page, expectedQuery = {}) {
      return actAndWaitForList(path, { ...expectedQuery, page }, () => cy.get(paginationControls.previous).click());
    },
    assertPreviousDisabled(disabled = true) {
      cy.get(paginationControls.previous).should(disabled ? 'be.disabled' : 'be.enabled');
    },
  };
}

export function assertPage(body, key, records, size, page, sortKey) {
  const start = (page - 1) * size;
  expect(body.page, 'current page').to.eq(page);
  expect(body.pageSize, 'rows per page').to.eq(size);
  expect(body.total, 'filtered record total').to.eq(records.length);
  return assertOrderedSlice(body[key], records, start, size, sortKey);
}

// Ties may move within their value group, including across a page boundary.
// Every returned identity must belong to the expected group in discovery.
export function assertOrderedSlice(actual, records, start, size, sortKey) {
  const expected = records.slice(start, start + size);
  expect(actual.length, 'expected number of records').to.eq(expected.length);
  expect(new Set(actual.map(row => row.id)).size, 'no repeated records').to.eq(actual.length);
  if (!sortKey) {
    expect(actual.map(row => row.id), 'ordered identities match discovery').to.deep.eq(expected.map(row => row.id));
    return expected;
  }
  expect(actual.map(row => row[sortKey]), `${sortKey} values at each position`).to.deep.eq(expected.map(row => row[sortKey]));
  const byId = new Map(records.map(row => [row.id, row]));
  return actual.map(row => {
    const original = byId.get(row.id);
    expect(original, 'record identity exists in discovery').to.exist;
    expect(row[sortKey], 'identity belongs to the expected sort group').to.eq(original[sortKey]);
    return original;
  });
}

export function assertPageCoverage(pages, records, sortKey) {
  // Only combine consecutive, non-overlapping pages from one traversal.
  const actual = pages.flat();
  assertOrderedSlice(actual, records, 0, actual.length, sortKey);
  const groups = new Map();
  records.forEach(row => {
    if (!groups.has(row[sortKey])) groups.set(row[sortKey], []);
    groups.get(row[sortKey]).push(row.id);
  });
  let end = 0;
  for (const [value, ids] of groups) {
    end += ids.length;
    if (end > actual.length) break;
    expect(actual.filter(row => row[sortKey] === value).map(row => row.id), 'complete sort group has no omitted identities')
      .to.have.members(ids);
  }
}
