import { randomUUID } from "node:crypto";

// One random administrator password per run. Workers inherit the environment,
// so every spec file, and a worker restarted after a failure, shares it.
export default function globalSetup() {
  process.env.E2E_ADMIN_PASSWORD ??= `E2e-${randomUUID()}`;
}
