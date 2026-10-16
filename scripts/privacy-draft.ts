// Saves the Phase 3 privacy notice revision (stored enquiries) as a DRAFT of
// the privacy page, for the owner to review in Preview and publish. Never
// publishes, and changes nothing if the page already has a newer draft or
// has been edited by a person since it was seeded.
//
//   pnpm privacy:draft
import { getPayload } from "payload";
import config from "../payload.config";
import { privacyRevisionForEnquiries } from "../lib/cms/pages-approved";
import { toLexical } from "../lib/cms/lexical";

const payload = await getPayload({ config });
const trusted = { overrideAccess: true } as const;

const { docs } = await payload.find({
  collection: "pages",
  where: { slug: { equals: "privacy" } },
  limit: 1,
  depth: 0,
  pagination: false,
  ...trusted,
});
const page = docs[0];
if (!page) {
  console.log("No privacy page in the CMS yet. Run pnpm seed first. Nothing was changed.");
} else {
  const [{ totalDocs: versions }, { totalDocs: byPeople }] = await Promise.all([
    payload.countVersions({ collection: "pages", where: { parent: { equals: page.id } }, ...trusted }),
    payload.countVersions({
      collection: "pages",
      where: { and: [{ parent: { equals: page.id } }, { "version.updatedBy": { exists: true } }] },
      ...trusted,
    }),
  ]);
  if (versions > 1 || byPeople > 0) {
    console.log("The privacy page has been edited or already has a draft. Nothing was changed.");
  } else {
    await payload.update({
      collection: "pages",
      id: page.id,
      draft: true,
      data: { body: toLexical(privacyRevisionForEnquiries) },
      ...trusted,
    });
    console.log(
      "Saved the stored-enquiries revision as a DRAFT of the privacy page. Review it with Preview, set the retention period, then publish.",
    );
  }
}
