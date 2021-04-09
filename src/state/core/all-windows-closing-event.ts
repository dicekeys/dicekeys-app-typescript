import { urlSafeBase64Encode } from "@dicekeys/dicekeys-api-js";
import { action, makeAutoObservable } from "mobx";
import { CustomEvent } from "../../utilities/event";
import { getRandomBytes } from "../../utilities/get-random-bytes";
import { autoSave } from "./auto-save";

const myWindowId = urlSafeBase64Encode(getRandomBytes(20));
const heartbeatFrequencyInMs = 5000;
let heartbeatInterval: any;

export const AllAppWindowsAndTabsAreClosingEvent = new CustomEvent<[], undefined>(undefined);

//const WindowsOpen =
new (class WindowsOpen {
	private openWindowIds: {[windowId: string]: number} = {};

	private sendHeartbeat = action( () => {
		this.openWindowIds[myWindowId] = (new Date()).getTime() + (2 * heartbeatFrequencyInMs);
	})

	private removeMyself = action( () => {
		clearInterval(heartbeatInterval);
		delete this.openWindowIds[myWindowId];
		if (!this.areOtherWindowsOpen) {
			AllAppWindowsAndTabsAreClosingEvent.send();
		}
	})

	get areOtherWindowsOpen(): boolean {
		const now = new Date().getTime();
		return Object.entries(this.openWindowIds).filter( ([id, expires]) =>
			id != myWindowId && expires > now
		).length > 0;
	}

	constructor() {
		makeAutoObservable(this);
		autoSave(this, "WindowsOpen");
		this.sendHeartbeat();
		heartbeatInterval = setInterval( this.sendHeartbeat, heartbeatFrequencyInMs );
		window.addEventListener("unload", () => {
			this.removeMyself();
    });
	}
})();
