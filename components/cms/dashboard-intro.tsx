/** Short orientation at the top of the CMS dashboard. */
export function DashboardIntro() {
  return (
    <section className="dw-dashboard-intro">
      <p className="dw-eyebrow">
        <span aria-hidden="true" />
        DeltaWave CMS
      </p>
      <h2>Content administration</h2>
      <p>
        Manage pages, services, industry solutions, the portfolio, media and
        site settings. Editors save drafts. Administrators review and publish.
      </p>
      <p className="dw-dashboard-note">
        The public website still reads its content from the codebase. Connecting
        these collections to the live pages is the next development phase.
      </p>
    </section>
  );
}
