import { action, makeAutoObservable } from 'mobx'
import { CustomEvent } from './event';

export class ObservableLocalStorageString<STORAGE_KEY extends string = string> {
	static readonly checkLocalStorageForChangesIntervalMs = 1000;
	static readonly #allObservableLocalStorageStringsCreated: ObservableLocalStorageString[] = [];
	static readonly #updateAllCachedValuesFromLocalStorage = () => {
		ObservableLocalStorageString.#allObservableLocalStorageStringsCreated.forEach( (obj) => {
				obj.updateCache();
		})
	}
	static readonly intervalForUpdatingAllValuesFromLocalStorage = setInterval(
		ObservableLocalStorageString.#updateAllCachedValuesFromLocalStorage,
		ObservableLocalStorageString.checkLocalStorageForChangesIntervalMs
	);

	/* Updating the cache will force mobx to observe changes */
	private _cachedValue: string | undefined;

	changed = new CustomEvent<[string | undefined]>(this);

	constructor(public readonly storageKey: STORAGE_KEY) {
		// Load initial value
		this._cachedValue= localStorage.getItem(this.storageKey) ?? undefined;
		// Ensure this value gets updated periodically from local storage
		ObservableLocalStorageString.#allObservableLocalStorageStringsCreated.push(this);
		// Make value observable
		makeAutoObservable(this);
	}

	private setCachedValue =  action ( (newValue: string | undefined) => {
		this._cachedValue = newValue;
		this.changed.sendEventually(newValue);
	});

	updateCache = () => {
		const fromLocalStorage = localStorage.getItem(this.storageKey) ?? undefined;
		const cachedValue = this._cachedValue;
		if (fromLocalStorage !== cachedValue) {
			this.setCachedValue(this._cachedValue = fromLocalStorage);
		}
	};

	get value(): string | undefined {
		this.updateCache();
		return this._cachedValue;
	}

	setValueIfChanged = ( (newValue: string | undefined) => {		
		const fromLocalStorage = localStorage.getItem(this.storageKey) ?? undefined;
		// Don't set if both values are nullish
		if (newValue == null && fromLocalStorage == null) return;
		// Don't set if both values are exactly equal
		if (fromLocalStorage === newValue) return;
		// They're not equal and at least one is non-nullish, so set
		this.setValue(newValue);
	});

	setValue = ( (newValue: string | undefined) => {
		if (newValue == null) {
			localStorage.removeItem(this.storageKey);
		} else {
			localStorage.setItem(this.storageKey, newValue);
		}
		this.setCachedValue(newValue);
	});
}

export class ObservableLocalStorageBoolean<STORAGE_KEY extends string = string> {
	/* Updating the cache will force mobx to observe changes */
	private readonly asString: ObservableLocalStorageString;

	changed = new CustomEvent<[boolean]>(this);

	constructor(
    public readonly storageKey: STORAGE_KEY,
    public readonly defaultValue: boolean = false
  ) {
    this.asString = new ObservableLocalStorageString(storageKey);
		this.asString.changed.on( (s) => this.changed.sendImmediately(s==="true") );
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


export class ObservableLocalStorageNumber<STORAGE_KEY extends string = string> {
	/* Updating the cache will force mobx to observe changes */
	private readonly asString: ObservableLocalStorageString;

	fromString = (asString?: string): number => {
		return asString == null ? this.defaultValue : 
			this.integersOnly ?
				parseInt(asString) :
				parseFloat(asString);
	}

	changed = new CustomEvent<[number]>(this);

	constructor(
    public readonly storageKey: STORAGE_KEY,
		public readonly integersOnly: boolean = false,
    public readonly defaultValue: number = Number.NaN
  ) {
    this.asString = new ObservableLocalStorageString(storageKey);
		this.asString.changed.on( (s) => this.changed.sendImmediately(this.fromString(s)) );
		makeAutoObservable(this);
	}

	get value(): number {
		return this.fromString( this.asString.value);
	}

	setValue = (newValue: number) => {
		if (!Number.isFinite(newValue)) {
			this.asString.setValue(undefined);
		} else {
    	this.asString.setValue(newValue.toString());
		}
	};
}