// Deployment check for enquiry storage: stores one clearly labelled test
// enquiry through the same code the contact form uses, checks duplicate
// protection and the notification status, then deletes the record. Sends a
// notification only when --notify is passed (to the published receiver).
//
//   node node_modules/payload/bin.js run scripts/verify-enquiries.ts
import { randomUUID } from "node:crypto";
import { getPayload } from "payload";
import config from "../payload.config";
import { getEnquiryRouting, notifyEnquiry, storeEnquiry } from "../lib/cms/enquiries";

const payload = await getPayload({ config });
const notify = process.argv.includes("--notify");
const enquiry = {
  name: "DeltaWave deployment check (test, deleted automatically)",
  email: "deployment-check@deltawave.tech",
  phone: "+8801000000000",
  company: "DeltaWave test",
  service: "Other",
  description: "Automated deployment check of enquiry storage. Not a customer enquiry.",
  consent: true,
  website: "",
  challenge: "",
  startedAt: Date.now(),
  submissionId: randomUUID(),
};

const results: string[] = [];
const first = await storeEnquiry(enquiry);
results.push(`stored: enquiry ${first.id} (duplicate: ${first.duplicate})`);
const again = await storeEnquiry(enquiry);
results.push(`retry: ${again.duplicate && again.id === first.id ? "recognised as the same enquiry" : "STORED TWICE"}`);
const routing = await getEnquiryRouting();
const sent = notify
  ? await notifyEnquiry(first.id, enquiry, routing)
  : await notifyEnquiry(first.id, enquiry, { ...routing, notify: false });
const record = await payload.findByID({ collection: "enquiries", id: first.id, overrideAccess: true, depth: 0 });
results.push(`notification: ${record.notification} (${record.notificationNote ?? ""})${sent ? " - accepted" : ""}`);
await payload.delete({ collection: "enquiries", id: first.id, overrideAccess: true });
const left = await payload.count({ collection: "enquiries", where: { id: { equals: first.id } }, overrideAccess: true });
results.push(`cleanup: ${left.totalDocs === 0 ? "test enquiry deleted" : "TEST ENQUIRY STILL PRESENT"}`);

console.log(results.join("\n"));
if (again.id !== first.id || left.totalDocs !== 0) process.exit(1);
