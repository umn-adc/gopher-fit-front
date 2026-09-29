import type { CredentialStore } from "./api";

// Web keeps credentials in memory only: no localStorage, cookies or IndexedDB.
export const credentialStore: CredentialStore | undefined = undefined;
