import { autorun, runInAction, set, toJS } from 'mobx'
import { decryptJsonStorageField, encryptJsonStorageField } from './session-encryption-key'


export function autoSave<T>(_this: T, name: string) {
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
