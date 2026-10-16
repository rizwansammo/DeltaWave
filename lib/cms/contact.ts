import type { ContactSectionData } from "@/components/site/contact";
import { extraServiceOptions } from "@/cms/options";
import { approvedCatalog } from "./catalog-approved";
import { getCatalog } from "./catalog";
import { isDatabaseUnavailable } from "./errors";
import { getPageContent, getSiteSettings } from "./pages";
import { businessContact } from "./pages-view";

// What the contact band needs: the business details from site settings, its
// copy from the page content, and the "Service required" options.

/**
 * The options of the enquiry form, in the order they are shown: the published
 * service categories, then the fixed extras. The approved categories are used
 * if the database cannot be reached, so the form still lists real services.
 */
export async function getServiceOptions(): Promise<string[]> {
  let titles: string[];
  try {
    titles = (await getCatalog()).categories.map((category) => category.title);
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;
    console.error("Service options unavailable: the database cannot be reached.", error);
    titles = approvedCatalog().categories.map((category) => category.title);
  }
  return [...titles, ...extraServiceOptions];
}

export async function getContactSectionData(): Promise<ContactSectionData> {
  const [{ settings }, { content }, serviceOptions] = await Promise.all([
    getSiteSettings(),
    getPageContent(),
    getServiceOptions(),
  ]);
  return {
    introLines: content.contact.section.detailsIntroLines,
    note: content.contact.section.note,
    details: businessContact(settings),
    serviceOptions,
  };
}
