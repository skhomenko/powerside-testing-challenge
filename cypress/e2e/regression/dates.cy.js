import { datePages, discoverDates, boundaryDay, visitDates, setDate, collectDisplayed, assertWindow, nextDay } from '../../support/dates';

const issues = 'https://github.com/skhomenko/powerside-testing-challenge/issues/';

for (const page of datePages) {
  describe(`TC-06 | ${page.name} displayed-day boundaries [Regression]`, () => {
    let discovery;
    before(() => {
      cy.signIn();
      discoverDates(page).then(result => { discovery = result; });
    });
    beforeEach(() => cy.signIn());

    it('From alone excludes earlier displayed calendar days (#17)', () => {
      const { page, baseline } = discovery;
      const day = boundaryDay(baseline, page.timestamp, 'from');
      visitDates(page);
      setDate(page, 'from', day).then(body => collectDisplayed(page, body)).then(actual => {
        assertWindow(actual, baseline, page.timestamp, day, null, `${issues}17`);
      });
    });

    it('To includes the whole displayed day, including after moving forward and back (#8)', () => {
      const { page, baseline } = discovery;
      const day = boundaryDay(baseline, page.timestamp, 'to');
      visitDates(page);
      let initial, advanced;
      setDate(page, 'to', day).then(body => collectDisplayed(page, body)).then(rows => { initial = rows; });
      setDate(page, 'to', nextDay(day)).then(body => collectDisplayed(page, body)).then(rows => { advanced = rows; });
      setDate(page, 'to', day).then(body => collectDisplayed(page, body)).then(restored => {
        // Run all three interactions before asserting so the first defect cannot hide the return check.
        const failures = [];
        [[initial, day, 'initial'], [advanced, nextDay(day), 'advanced'], [restored, day, 'restored']].forEach(([rows, to, label]) => {
          try { assertWindow(rows, baseline, page.timestamp, null, to, `${issues}8`); }
          catch (error) { failures.push(`${label}: ${error.message}`); }
        });
        try { expect(restored.map(row => row.id), 'Intended To behavior: returning To restores the same identities').to.deep.eq(initial.map(row => row.id)); }
        catch (error) { failures.push(`restored identities: ${error.message}`); }
        expect(failures.length, `To window checks: ${issues}8. ${failures.join('; ')}`).to.eq(0);
      });
    });

    it('equal From and To contains the complete selected displayed day only (#8, #17)', () => {
      const { page, baseline } = discovery;
      const day = boundaryDay(baseline, page.timestamp, 'to');
      visitDates(page);
      setDate(page, 'from', day);
      setDate(page, 'to', day).then(body => collectDisplayed(page, body)).then(actual => {
        assertWindow(actual, baseline, page.timestamp, day, day, `${issues}8 and ${issues}17`);
      });
    });
  });
}
