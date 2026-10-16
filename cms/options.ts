// Fixed option lists shared by the CMS schema and the public site's filters.
// Plain data only, so client components can import it.

export const solutionGroups = [
  "Commerce & operations",
  "People & organizations",
  "Services & communities",
] as const;

// Matches the portfolio filters on the public site.
export const projectTypes = [
  "Real projects",
  "Case studies",
  "Software demonstrations",
  "Product concepts",
  "Under development",
] as const;

// Honest delivery states. Nothing may be described as live or completed
// unless it actually is.
export const projectStatuses = [
  "Planned concept",
  "In development",
  "Live",
  "Completed",
] as const;

/** Enquiry form options offered besides the published service categories. */
export const extraServiceOptions = ["Academy interest", "Other"];
