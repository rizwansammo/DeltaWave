export const site = {
  // SITE_INDEXABLE is read at runtime, so one image can launch unindexed and
  // be opened to search engines later without a rebuild.
  indexable: (process.env.SITE_INDEXABLE ?? process.env.NEXT_PUBLIC_INDEXABLE) === "true",
  name: "DeltaWave Technology",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.deltawave.tech",
  email: "rizwan@deltawave.tech",
  phone: "+8801821777620",
  phoneDisplay: "+880 1821 777620",
  location: "Ward 7, Tobgi Union, Borhanuddin, Bhola, Bangladesh.",
  publicWebsite: "www.deltawave.tech",
};
export const nav = [
  ["Home", "/"],
  ["About", "/about"],
  ["Services", "/services"],
  ["Solutions", "/solutions"],
  ["Portfolio", "/portfolio"],
  ["Academy", "/academy"],
  ["Contact", "/contact"],
] as const;
export const serviceOptions = [
  "Software engineering & SaaS",
  "Business & industry solutions",
  "Cloud infrastructure & managed IT",
  "Creative & digital growth",
  "Academy interest",
  "Other",
];
