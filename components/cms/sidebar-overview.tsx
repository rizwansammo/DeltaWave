"use client";

import { Link } from "@payloadcms/ui";
import { LayoutDashboard } from "lucide-react";
import { usePathname } from "next/navigation";

/** First, unmistakable destination in the DeltaWave CMS sidebar. */
export function SidebarOverview() {
  const path = usePathname();
  const active = path === "/admin" || path === "/admin/";

  return (
    <div className="dw-nav-workspace">
      <span className="dw-nav-caption">Workspace</span>
      <Link
        aria-current={active ? "page" : undefined}
        className={`dw-nav-overview${active ? " dw-nav-overview--active" : ""}`}
        href="/admin"
        prefetch={false}
      >
        <LayoutDashboard aria-hidden="true" size={16} strokeWidth={1.8} />
        <span>Overview</span>
      </Link>
    </div>
  );
}
