import { autorun, runInAction, set, toJS } from 'mobx';
import { isRunningInPreviewMode } from '../../utilities/is-preview';
import { decryptJsonStorageField, encryptJsonStorageField } from './EncryptedStorageFields';
import { syncObservableWithLocalStorage } from '../../utilities/syncObservableWithLocalStorage';


export type JSON_ENCODABLE = string | number | boolean | null | {[x: string]: JSON_ENCODABLE} | Array<JSON_ENCODABLE>;

export function autoSave<T extends object>(_this: T, name: string, dontLoadOnPreview: boolean = false) {
	// We don't load or save state in preview mode
	if (dontLoadOnPreview && isRunningInPreviewMode()) return;

	syncObservableWithLocalStorage<JSON_ENCODABLE>(
		name,
		() => toJS(_this) as JSON_ENCODABLE,
		x => set(_this, x as T),
	);
	// const storedJson = localStorage.getItem(name)
	// if (storedJson) {
	// 	set(_this, JSON.parse(storedJson) as T)
	// }
	// autorun(() => {
	// 	const value = toJS(_this)
	// 	localStorage.setItem(name, JSON.stringify(value))
	// })
}

export function autoSaveEncrypted<T extends object>(_this: T, name: string, onReady: () => void, dontLoadOnPreview: boolean = false) {
	// We don't load or save state in preview mode
	if (dontLoadOnPreview && isRunningInPreviewMode()) {
		onReady();
		return;
	}

	const afterLoad = () => {
		autorun(() => {
			const value = JSON.stringify(toJS(_this))
			encryptJsonStorageField(value).then( encryptedValue => {
					// console.log(`Writing encrypted value to local store`, value);
					localStorage.setItem(name, encryptedValue)
				}
			);
		})
		onReady();
	}

	const encryptedStoredJson = localStorage.getItem(name);
	if (encryptedStoredJson) {
		decryptJsonStorageField(encryptedStoredJson).then( storedJson => {
			if (storedJson) {
				// console.log(`Loading encrypted value to local store`, storedJson);
				runInAction( () =>
					set(_this, JSON.parse(storedJson) as T)
				);
			}
			afterLoad();
		}).catch( (exception) => { 
			console.error("Storage load exception", exception)
			afterLoad();
		 } );
	} else {
		afterLoad();
	}
}
