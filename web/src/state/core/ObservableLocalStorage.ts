import { action, makeAutoObservable } from 'mobx'

export class ObservableLocalStorageString<STORAGE_KEY extends string = string> {
	/* Updating the cache will force mobx to observe changes */
	private _cachedValue: string | undefined;

	constructor(public readonly storageKey: STORAGE_KEY) {
		this._cachedValue= localStorage.getItem(this.storageKey) ?? undefined;
		makeAutoObservable(this);
	}

	get value(): string | undefined {
		const fromLocalStorage = localStorage.getItem(this.storageKey) ?? undefined;
		if (fromLocalStorage !== this._cachedValue) {
			this._cachedValue = fromLocalStorage;
		}
		return this._cachedValue;
	}

	setValue = action( (newValue: string | undefined) => {
		this._cachedValue = newValue;
		if (newValue == null) {
			localStorage.removeItem(this.storageKey);
		} else {
			localStorage.setItem(this.storageKey, newValue);
		}
	});
}

export class ObservableLocalStorageBoolean<STORAGE_KEY extends string = string> {
	/* Updating the cache will force mobx to observe changes */
	private readonly asString: ObservableLocalStorageString;

	constructor(
    public readonly storageKey: STORAGE_KEY,
    public readonly defaultValue: boolean = false
  ) {
    this.asString = new ObservableLocalStorageString(storageKey);
		makeAutoObservable(this);
	}

	get value(): boolean {
		const asString = this.asString.value;
    return asString == null ? this.defaultValue : asString === "true"
	}

	setValue = (newValue: boolean) => {
    this.asString.setValue(newValue ? "true" : "false");
	};

	setTrue = () => { this.setValue(true) }
	setFalse = () => { this.setValue(false) }
	toggleValue = () => { this.setValue(!this.value) }

}