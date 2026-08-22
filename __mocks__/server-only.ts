// Empty stand-in for the `server-only` package during Vitest runs.
// The real package throws at import time to keep server code out of client
// bundles. Vitest doesn't distinguish server/client, so we neutralise it.
export {};
