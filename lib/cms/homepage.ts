import config from "@payload-config";
import { getPayload } from "payload";
import { readHomepage } from "./homepage-state";

export type { HomepageResult, HomepageState } from "./homepage-state";

/**
 * The public homepage for the current request, read through Payload's Local
 * API. Server-only. See ./homepage-state.ts for the states and fallbacks.
 */
export const getHomepage = () => readHomepage(() => getPayload({ config }));
