import { urlSafeBase64Encode } from "@dicekeys/dicekeys-api-js";
import { CustomEvent } from "../../utilities/event";
import { getRandomBytes } from "../../utilities/get-random-bytes";

const myWindowId = urlSafeBase64Encode(getRandomBytes(20));
const heartbeatFrequencyInMs = 10000;
let heartbeatInterval: any;

const localStoreName = "DiceKeysOpenWindowIds"

export const AllAppWindowsAndTabsAreClosingEvent = new CustomEvent<[], undefined>(undefined);

const removeExpiredWindowIds = (windowIds: {[windowId: string]: number}): {[windowId: string]: number} => {
	const now = new Date().getTime();
	return Object.entries(windowIds).reduce( (activeWindowIds, entry) => {
		const [windowId, whenExpires] = entry;
		if (whenExpires > now) {
			activeWindowIds[windowId] = whenExpires;
		}
		return activeWindowIds
	}, {} as {[windowId: string]: number});
}
	

//const WindowsOpen =
new (class WindowsOpen {
	private get openWindowIds(): {[windowId: string]: number} {
		try {
			const openWindowIdsObj = JSON.parse( localStorage.getItem(localStoreName) ?? "{}" );
			if (typeof openWindowIdsObj === "object" && openWindowIdsObj != null) {
				return removeExpiredWindowIds(openWindowIdsObj);
			}
		} catch {}
		return {};
	};

	private set openWindowIds(windowIds: {[windowId: string]: number}) {
		localStorage.setItem(localStoreName, JSON.stringify(windowIds));
	};

	private sendHeartbeat = () => {
		// this.openWindowIds[myWindowId] = (new Date()).getTime() + (2 * heartbeatFrequencyInMs);
		this.openWindowIds = {...this.openWindowIds, [myWindowId]: Date.now() + (2 * heartbeatFrequencyInMs)};
	}

	private removeMyself = () => {
		clearInterval(heartbeatInterval);
		const ids = this.openWindowIds;
		delete ids[myWindowId];
		this.openWindowIds = ids; 
		// delete this.openWindowIds[myWindowId];
		if (!this.areOtherWindowsOpen) {
			AllAppWindowsAndTabsAreClosingEvent.sendImmediately();
		}
	}

	get areOtherWindowsOpen(): boolean {
		const now = Date.now();
		return Object.entries(this.openWindowIds).filter( ([id, expires]) =>
			id != myWindowId && expires > now
		).length > 0;
	}

	constructor() {
		this.sendHeartbeat();
		heartbeatInterval = setInterval( this.sendHeartbeat, heartbeatFrequencyInMs );
		window.addEventListener("unload", () => {
			this.removeMyself();
    });
	}
})();
