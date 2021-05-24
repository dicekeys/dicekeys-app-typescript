import { computed, makeObservable, runInAction } from "mobx";
import { DiceKey } from "../../dicekeys/DiceKey";
import { DiceKeyMemoryStore } from "../stores/DiceKeyMemoryStore";
import { HasSubViews } from "../core";

export enum SelectedDiceKeySubViews {
  DisplayDiceKey, // primary view
  Backup,
  SeedHardwareKey,
  DeriveSecrets,
//  Save
}

export class SelectedDiceKeyViewState extends HasSubViews<SelectedDiceKeySubViews> {

  public get diceKey(): DiceKey | undefined {
    return this.keyId ? DiceKeyMemoryStore.diceKeyForKeyId(this.keyId) : undefined;
  };

  public setDiceKey = async (diceKey?: DiceKey) => {
    if (diceKey == null) return;
    const keyId = await diceKey.keyId();
    runInAction( () => {
      DiceKeyMemoryStore.addDiceKeyForKeyId(keyId, diceKey);
      this.keyId = keyId;
    })
  }

  constructor(
    public readonly goBack: () => any,
    public keyId: string,
    initialSubView: SelectedDiceKeySubViews = SelectedDiceKeySubViews.DisplayDiceKey
  ) {
    super(initialSubView);
    makeObservable(this, {
      diceKey: computed
    });
  }

  navigateToDisplayDiceKey = this.navigateToSubView(SelectedDiceKeySubViews.DisplayDiceKey);
  navigateToBackup = this.navigateToSubView(SelectedDiceKeySubViews.Backup);
  navigateToSeedHardwareKey = this.navigateToSubView(SelectedDiceKeySubViews.SeedHardwareKey);
  navigateToDeriveSecrets = this.navigateToSubView(SelectedDiceKeySubViews.DeriveSecrets);

  static create = async (
    goBack: () => any,
    diceKey: DiceKey,
    initialSubView: SelectedDiceKeySubViews | undefined = undefined
  ): Promise<SelectedDiceKeyViewState> => {
    const keyId = await diceKey.keyId();
    DiceKeyMemoryStore.addDiceKeyForKeyId(keyId, diceKey);
    return new SelectedDiceKeyViewState(goBack, keyId, initialSubView);
  }

}
