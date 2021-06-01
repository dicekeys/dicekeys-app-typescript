import { autorun, runInAction, set, toJS } from 'mobx'
import { isRunningInPreviewMode } from '../../utilities/is-preview'
import { decryptJsonStorageField, encryptJsonStorageField } from './EncryptedStorageFields'


export function autoSave<T>(_this: T, name: string, dontLoadOnPreview: boolean = false) {
	// We don't load or save state in preview mode
	if (dontLoadOnPreview && isRunningInPreviewMode()) return;

	const storedJson = localStorage.getItem(name)
	if (storedJson) {
		set(_this, JSON.parse(storedJson) as T)
	}
	autorun(() => {
		const value = toJS(_this)
		localStorage.setItem(name, JSON.stringify(value))
	})
}

export function autoSaveEncrypted<T>(_this: T, name: string, onReady: () => any, dontLoadOnPreview: boolean = false) {
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
