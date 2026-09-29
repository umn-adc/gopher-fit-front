import * as SecureStore from "expo-secure-store";
import type { CredentialStore } from "./api";

const KEY = "gopherfit.refresh_token";
// Readable only while the device is unlocked; never restored onto another device.
const options: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

// Native keeps only the refresh token; the access token stays in memory.
export const credentialStore: CredentialStore | undefined = {
  load: () => SecureStore.getItemAsync(KEY, options),
  save: (refreshToken) => SecureStore.setItemAsync(KEY, refreshToken, options),
  clear: () => SecureStore.deleteItemAsync(KEY, options),
};
