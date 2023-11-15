import { autorun } from 'mobx';
import { JSON_ENCODABLE } from '../state/core/AutoSave';


export function syncObservableWithLocalStorage<T_JSON_ENCODABLE extends JSON_ENCODABLE>(
	storageName: string,
	toJsonEncodable: () => T_JSON_ENCODABLE,
	restoreFromJsonEncodable: (jsonEncodable: T_JSON_ENCODABLE) => void,
	{
		readOnWindowVisible = true,
		readOnWindowFocus = true,
		readAtIntervalInMs,
	}: {
		readOnWindowVisible?: boolean;
		readOnWindowFocus?: boolean;
		readAtIntervalInMs?: number;
	} = {}
) {
	let lastReadJson: string | undefined;
	const readFromStorage = () => {
		const storedJson = localStorage.getItem(storageName);
		if (storedJson != null && storedJson != lastReadJson) {
			lastReadJson = storedJson;
			restoreFromJsonEncodable(JSON.parse(storedJson) as T_JSON_ENCODABLE);
		}
	};
	const readFromStorageIfDocumentVisible = () => {
		if (document.visibilityState === "visible") {
			readFromStorage();
		}
	}
	if (readOnWindowVisible) {
		document.addEventListener('visibilitychange', readFromStorageIfDocumentVisible);
	}
	if (readOnWindowFocus) {
		window.addEventListener('focus', readFromStorage);
	}
	if (readAtIntervalInMs != null && readAtIntervalInMs > 0) {
		setInterval( readFromStorageIfDocumentVisible, readAtIntervalInMs)
	}
	readFromStorage();
	autorun(() => {
		lastReadJson = JSON.stringify(toJsonEncodable());
		localStorage.setItem(storageName, lastReadJson);
	});

}
