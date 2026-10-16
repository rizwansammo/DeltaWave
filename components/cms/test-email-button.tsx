"use client";

import { Button, useAuth, useConfig } from "@payloadcms/ui";
import { useState } from "react";
import { isAdmin, type Role } from "@/cms/access";

/** Sends one test message to the published primary receiver. Administrators only. */
export function TestEmailButton() {
  const { user } = useAuth<{ roles?: Role[] | null }>();
  const {
    config: { routes, serverURL },
  } = useConfig();
  const [state, setState] = useState<{ busy: boolean; message: string }>({ busy: false, message: "" });
  if (!isAdmin(user)) return null;
  const send = async () => {
    setState({ busy: true, message: "" });
    try {
      const response = await fetch(`${serverURL}${routes.api}/globals/site-settings/test-email`, {
        method: "POST",
        credentials: "include",
      });
      const body = (await response.json()) as { message?: string };
      setState({ busy: false, message: body.message ?? "No response from the server." });
    } catch {
      setState({ busy: false, message: "The test could not be sent." });
    }
  };
  return (
    <div>
      <Button buttonStyle="secondary" size="small" disabled={state.busy} onClick={send}>
        {state.busy ? "Sending…" : "Send a test email"}
      </Button>
      {state.message && (
        <p role="status" style={{ marginTop: "8px" }}>
          {state.message}
        </p>
      )}
    </div>
  );
}
