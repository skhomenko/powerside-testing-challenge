import { actAndWaitForList, rowsMatch, select, readAll } from './lists';
import { pagination } from './pagination';

export const datePages = [
  { name: 'Alarms', route: '/alarms', path: '/api/events', prefix: 'alarm', rows: '[data-cy="alarm-row"]', attribute: 'data-alarm-id', timestamp: 'timestamp', timeColumn: 2, scope: { status: 'Resolved' } },
  { name: 'Events', route: '/events', path: '/api/pq-events', prefix: 'pq', rows: '[data-cy="pq-event-row"]', attribute: 'data-event-id', timestamp: 'started_at', timeColumn: 0, scope: {} },
];

const dayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Toronto', year: 'numeric', month: '2-digit', day: '2-digit',
});
const hourFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Toronto', hour: '2-digit', hourCycle: 'h23',
});
const displayFormatter = new Intl.DateTimeFormat(undefined, {
  timeZone: 'America/Toronto', year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit',
});

export function calendarDay(timestamp) {
  const parts = dayFormatter.formatToParts(new Date(timestamp));
  const part = type => parts.find(value => value.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function nextDay(day, delta = 1) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

function boundaryCandidates(records, field, direction) {
  const days = new Map();
  for (const record of records) {
    const day = calendarDay(record[field]);
    const hour = Number(hourFormatter.format(new Date(record[field])));
    const flags = days.get(day) || { morning: false, late: false };
    flags.morning ||= hour < 12;
    flags.late ||= hour >= 20;
    days.set(day, flags);
  }
  const lastDay = [...days.keys()].sort().at(-1);
  return [...days.keys()].sort().filter(day => days.get(day).morning && days.get(day).late
    && days.get(nextDay(day, -1))?.late && days.has(nextDay(day))
    && (direction !== 'to' || lastDay > nextDay(day)));
}

export function boundaryDay(records, field, direction) {
  const candidates = boundaryCandidates(records, field, direction);
  if (!candidates.length) throw new Error(`DATA BLOCKER: require consecutive displayed days, morning and late-evening records on the selected day, and late evening on the previous day.${direction === 'to' ? ' To forward/back checks also require a record after the advanced day.' : ''}`);
  return direction === 'from' ? candidates.at(-1) : candidates[0];
}

export function discoverDates(page) {
  return readAll(page.path, 'events', page.scope).then(records => {
    if (page.name !== 'Alarms') return { page, baseline: records };
    const devices = new Map();
    for (const record of records) {
      if (!devices.has(record.device_id)) devices.set(record.device_id, []);
      devices.get(record.device_id).push(record);
    }
    const baseline = [...devices.values()].sort((a, b) => a.length - b.length)
      .find(group => boundaryCandidates(group, page.timestamp, 'to').length);
    if (!baseline) throw new Error('DATA BLOCKER: no device has resolved alarms with the required calendar boundary witnesses.');
    return {
      page: { ...page, scope: { ...page.scope, deviceId: baseline[0].device_id }, deviceName: baseline[0].device_name },
      baseline,
    };
  });
}

export function visitDates(page) {
  actAndWaitForList(page.path, { page: 1, pageSize: 15 }, () => cy.visit(page.route));
  if (page.name === 'Alarms') {
    actAndWaitForList(page.path, { status: 'Resolved' }, () => select('alarm-status-filter', 'Resolved'));
    actAndWaitForList(page.path, page.scope, () => select('alarm-device-filter', page.deviceName));
  }
  return pagination(page.path).setPageSize(50, page.scope);
}

export function setDate(page, boundary, day) {
  return actAndWaitForList(page.path, { ...page.scope, [boundary]: day, page: 1 }, () => {
    const input = `#${page.prefix}-${boundary}-date`;
    cy.get(input).clear();
    cy.get(input).type(day).should('have.value', day);
  });
}

export function collectDisplayed(page, body, accumulated = []) {
  if (!body.events.length) {
    cy.contains(page.name === 'Alarms' ? 'No alarms match your filters' : 'No power quality events match your filters').should('be.visible');
    return cy.wrap(accumulated, { log: false });
  }
  rowsMatch(page.rows, body.events, page.attribute);
  return cy.get(page.rows).then($rows => {
    const rendered = [...$rows].map((row, index) => {
      const timestamp = body.events[index][page.timestamp];
      // Compare the documented display format directly, without parsing locale-dependent date text.
      const displayed = row.querySelectorAll('td')[page.timeColumn].textContent.trim();
      expect(displayed, 'displayed timestamp basis').to.eq(displayFormatter.format(new Date(timestamp)));
      return { id: Number(row.getAttribute(page.attribute)), day: calendarDay(timestamp) };
    });
    const all = accumulated.concat(rendered);
    if (body.page < body.totalPages) {
      if (body.page >= 50) throw new Error('DATA BLOCKER: date UI traversal exceeded 50 pages.');
      return pagination(page.path).nextPage(body.page + 1, { ...page.scope, pageSize: 50 })
        .then(next => collectDisplayed(page, next, all));
    }
    cy.get('button[aria-label="Go to next page"]').should('be.disabled');
    expect(new Set(all.map(row => row.id)).size, 'date pages contain no duplicate rows').to.eq(all.length);
    return cy.wrap(all, { log: false });
  });
}

export function assertWindow(actual, baseline, field, from, to, issue) {
  const inside = day => (!from || day >= from) && (!to || day <= to);
  const expected = baseline.filter(row => inside(calendarDay(row[field])));
  expect(expected.length, 'DATA BLOCKER: matching boundary examples').to.be.greaterThan(0);
  expect(expected.length, 'DATA BLOCKER: nonmatching boundary examples').to.be.lessThan(baseline.length);
  const ids = new Set(actual.map(row => row.id));
  const expectedIds = new Set(expected.map(row => row.id));
  const outside = actual.filter(row => !inside(row.day) || !expectedIds.has(row.id));
  const missing = expected.filter(row => !ids.has(row.id));
  expect(outside.length + missing.length, `Intended inclusive displayed-day boundaries: ${outside.length} outside, ${missing.length} missing. ${issue}`).to.eq(0);
}
