import { Capacitor, registerPlugin } from "@capacitor/core";

type FocusLockPlugin = {
  start(): Promise<{ locked: boolean }>;
  stop(): Promise<void>;
  isLocked(): Promise<{ locked: boolean }>;
};

const plugin = registerPlugin<FocusLockPlugin>("FocusLock");

/** Screen pinning only exists on Android in the installed app. */
export const focusLockSupported = Capacitor.getPlatform() === "android" && Capacitor.isNativePlatform();

export async function lockToFeit() {
  if (!focusLockSupported) return false;
  try {
    const result = await plugin.start();
    return result.locked === true;
  } catch {
    return false;
  }
}

export async function unlockFromFeit() {
  if (!focusLockSupported) return;
  try {
    await plugin.stop();
  } catch { /* pinning was never active */ }
}

export async function isFeitLocked() {
  if (!focusLockSupported) return false;
  try {
    const result = await plugin.isLocked();
    return result.locked === true;
  } catch {
    return false;
  }
}
