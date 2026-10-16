"use client";

import { PublishButton, useAuth } from "@payloadcms/ui";
import type { PublishButtonClientProps } from "payload";
import { isAdmin, type Role } from "@/cms/access";

/**
 * Payload's Publish button, shown to administrators only. Editors keep Save
 * Draft. The server refuses an editor's publish either way (cms/versioned.ts);
 * this only removes a button that could never succeed for them.
 */
export function AdminPublishButton(props: PublishButtonClientProps) {
  const { user } = useAuth<{ roles?: Role[] | null }>();
  return isAdmin(user) ? <PublishButton {...props} /> : null;
}
