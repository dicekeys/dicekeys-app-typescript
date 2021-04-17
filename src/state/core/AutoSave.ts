import { autorun, runInAction, set, toJS } from 'mobx'
import { isRunningInPreviewMode } from '../../utilities/is-preview'
import { decryptJsonStorageField, encryptJsonStorageField } from './EncryptedStorageFields'


export function autoSave<T>(_this: T, name: string) {
	// We don't load or save state in preview mode
	if (isRunningInPreviewMode()) return;

	const storedJson = localStorage.getItem(name)
	if (storedJson) {
		set(_this, JSON.parse(storedJson) as T)
	}
	autorun(() => {
		const value = toJS(_this)
		localStorage.setItem(name, JSON.stringify(value))
	})
}

export function autoSaveEncrypted<T>(_this: T, name: string) {
	// We don't load or save state in preview mode
	if (isRunningInPreviewMode()) return;

	const encryptedStoredJson = localStorage.getItem(name);
	if (encryptedStoredJson) {
		decryptJsonStorageField(encryptedStoredJson).then( storedJson => {
			if (storedJson) {
				runInAction( () =>
					set(_this, JSON.parse(storedJson) as T)
				);
			}
		});
	}
	autorun(() => {
		const value = JSON.stringify(toJS(_this))
		encryptJsonStorageField(value).then( encryptedValue =>
			localStorage.setItem(name, encryptedValue)
		);
	})
}
