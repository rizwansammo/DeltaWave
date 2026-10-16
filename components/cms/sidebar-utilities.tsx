"use client";

import { Link } from "@payloadcms/ui";
import { ExternalLink, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";

/** Utility destinations, separate from Payload's permission-filtered content nav. */
export function SidebarUtilities() {
  const pathname = usePathname();
  const accountActive = pathname === "/admin/account";

  return (
    <div className="dw-nav-utilities" aria-label="Workspace shortcuts">
      <a className="dw-nav-utility" href="/" rel="noopener noreferrer" target="_blank">
        <ExternalLink aria-hidden="true" size={15} strokeWidth={1.8} />
        <span>View website</span>
      </a>
      <Link
        aria-current={accountActive ? "page" : undefined}
        className={`dw-nav-utility${accountActive ? " dw-nav-utility--active" : ""}`}
        href="/admin/account"
        prefetch={false}
      >
        <UserRound aria-hidden="true" size={15} strokeWidth={1.8} />
        <span>My account</span>
      </Link>
    </div>
  );
}
