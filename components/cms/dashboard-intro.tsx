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
        The homepage is live from the CMS: once the Homepage is published, visitors
        see the change on their next page load. The other pages still read their
        content from the codebase and move over in the next development steps.
      </p>
    </section>
  );
}
