import { mainToAllRenderersClient } from "./MainProcessApiFactory";


// const keyToBroadcastChannel = `SynchronizedStringState-Broadcast` as const;
export type  getSynchronizedStringForKey = (key: string) => string | undefined;
export type setSynchronizedStringForKey = (key: string, newValue: string | undefined) => void;

export const SynchronizedStringState = new class {
  keyToSynchronizedString = new Map<string,string>();

  getSynchronizedStringForKey: getSynchronizedStringForKey =
    (key: string) => {
      const value = this.keyToSynchronizedString.get(key);
      console.log(`Fetched '${key}' as`, value);
      return value;
    }

  setSynchronizedStringForKey: setSynchronizedStringForKey =
    (key, newValue) => {
    const currentValue = this.keyToSynchronizedString.get(key);
    if (newValue === currentValue) return;
    console.log(`Setting '${key}' to`, newValue);
    if (newValue == null) {
      this.keyToSynchronizedString.delete(key);
    } else {
      this.keyToSynchronizedString.set(key, newValue);
    }
    mainToAllRenderersClient.broadcastUpdatedSynchronizedStringState(key, newValue);
  }

}();

