import { ApiCalls } from "@dicekeys/dicekeys-api-js";
import { QueuedApiRequest } from "../../api-handler/QueuedApiRequest";
import { DiceKeyWithKeyId } from "../../dicekeys/DiceKey";
import { action, makeAutoObservable } from "mobx";
import { DiceKeyMemoryStore } from "../../state";
import { LoadDiceKeyViewState } from "../../views/LoadingDiceKeys/LoadDiceKeyViewState";
import { MobxObservedPromise } from "../../utilities/MobxObservedPromise";
import { NumericTextFieldState } from "../../views/basics/NumericTextFieldView";
import { addSequenceNumberToRecipeJson } from "../../dicekeys/ConstructRecipe";
import { RUNNING_IN_ELECTRON } from "../../utilities/is-electron";
import { ApiRequestsReceivedState } from "../../state/ApiRequestsReceivedState";

export class ApproveApiRequestState {
  static lastKeyIdUsed: string | undefined;

  private _diceKey: DiceKeyWithKeyId | undefined;
  get diceKey() { return this._diceKey; }

  setDiceKey = action((diceKey: DiceKeyWithKeyId) => {
    ApproveApiRequestState.lastKeyIdUsed = diceKey.keyId;
    this._diceKey = diceKey;
  });

  private _sendingResponse: boolean = false;
  get sendingResponse() { return this._sendingResponse; }
  setSendingResponse = action(() => {
    this._sendingResponse = true;
  });


  setDiceKeyFromId =  async (keyId: string | undefined) => {
    if (keyId == null) return;
    const diceKey = await DiceKeyMemoryStore.load({keyId});
    if (diceKey == null) return;
    this.setDiceKey(diceKey);
  };

  get originalRecipeJson() {
    return "recipe" in this.queuedApiRequest.originalRequest ? this.queuedApiRequest.originalRequest.recipe : undefined;
  }

  get mutatedRequest() {
    const modifiedRecipeJson = this.modifiedRecipeJson;
    return modifiedRecipeJson == null ? undefined : {
      // Sequence number so do modify request
      ...this.queuedApiRequest.originalRequest,
      recipe: modifiedRecipeJson
    } as ApiCalls.RequestMessage;
  }

  sequenceNumberState = new NumericTextFieldState({
    minValue: 2, incrementBy: 1, defaultValue: undefined, onChanged: () => {
      this.queuedApiRequest.mutatedRequest = this.mutatedRequest;
    }
  });
  get sequenceNumber(): number | undefined { return this.sequenceNumberState.numericValue; }

  get modifiedRecipeJson() {
    const originalRecipeJson = "recipe" in this.queuedApiRequest.originalRequest ? this.queuedApiRequest.originalRequest.recipe : undefined;
    if (originalRecipeJson == null || this.sequenceNumberState.numericValue == null || this.sequenceNumberState.numericValue < 2) {
      // No sequence number so do not modify request
      return this.originalRecipeJson;
    } else {
      return addSequenceNumberToRecipeJson(originalRecipeJson, this.sequenceNumberState.numericValue);
    }
  }

  get recipeJson() { return this.modifiedRecipeJson ?? this.originalRecipeJson; }

  get response() {
    const seedString = this.diceKey?.toSeedString();
    if (seedString == null)
      return;
    return new MobxObservedPromise<ApiCalls.Response>(this.queuedApiRequest.getResponseForRequest(seedString, this.mutatedRequest ?? this.queuedApiRequest.request));
  }

  private _loadDiceKeyViewState: LoadDiceKeyViewState | undefined;
  get loadDiceDiceInProgress(): boolean { return this._loadDiceKeyViewState != null; }
  get loadDiceKeyViewState() { return this._loadDiceKeyViewState; }
  readonly setLoadDiceKeyViewState = action((newValue: LoadDiceKeyViewState | undefined) => {
    this._loadDiceKeyViewState = newValue;
  });

  startLoadDiceKey = () => {
    this.setLoadDiceKeyViewState(new LoadDiceKeyViewState());
  };

  onDiceKeyReadOrCancelled = (diceKeyWithKeyId: DiceKeyWithKeyId | undefined) => {
    this.setLoadDiceKeyViewState(undefined);
    if (diceKeyWithKeyId != null) {
      DiceKeyMemoryStore.addDiceKeyWithKeyId(diceKeyWithKeyId);
      this.setDiceKey(diceKeyWithKeyId);
    }
  };

  private _revealCenterLetterAndDigit: boolean = true;
  get revealCenterLetterAndDigit() { return this._revealCenterLetterAndDigit }
  readonly setRevealCenterLetterAndDigit = action( (revealCenterLetterAndDigit: boolean) => {
    this._revealCenterLetterAndDigit = revealCenterLetterAndDigit
  });
  readonly toggleRevealCenterLetterAndDigit = () => this.setRevealCenterLetterAndDigit(!this.revealCenterLetterAndDigit)

  get centerLetterAndDigit() { return this.diceKey?.centerLetterAndDigit }
  get centerLetterAndDigitToReveal() {  return this.revealCenterLetterAndDigit ?
    (this.diceKey?.centerLetterAndDigit) : undefined
  }

  respondSuccessfully = () => {
    const seedString = this.diceKey?.toSeedString();
    if (seedString == null)
      return;
    const centerLetterAndDigit = this.centerLetterAndDigitToReveal;
    const sequenceNumber = this.sequenceNumber;
    this.queuedApiRequest.respond(seedString, {centerLetterAndDigit, sequenceNumber});
    this.startCompleteRequest();
  }

  respondByDeclining = () => {
    this.queuedApiRequest.sendUserDeclined();
    this.startCompleteRequest(500);
  }

  startCompleteRequest = (howLongToWaitMs: number = RUNNING_IN_ELECTRON ? 2000 : 500) => {
    this.setSendingResponse();
    setTimeout(this.#completeRequest, howLongToWaitMs)
  }

  #completeRequest = () => {
    if (RUNNING_IN_ELECTRON) {
      // Electron handles one API request per window, so close the window when a request is resolved.
      window.close();
    } else {
      // Remove the request from the queue.
      ApiRequestsReceivedState.dequeueApiRequestReceived();
    }
  }

  get request() { return this.queuedApiRequest.request }
  get host() { return this.queuedApiRequest.host }
  get command(): ApiCalls.Command { return this.queuedApiRequest.originalRequest.command  }


  constructor(
    public readonly queuedApiRequest: QueuedApiRequest,
    diceKey?: DiceKeyWithKeyId
  ) {
    this._diceKey = diceKey;
    if (diceKey == null) {
      DiceKeyMemoryStore.onReady(() => {
          this.setDiceKeyFromId(ApproveApiRequestState.lastKeyIdUsed ??= DiceKeyMemoryStore.keysInMemoryOrSavedToDevice[0]?.keyId);
      });
    }
    makeAutoObservable(this);
  }

}
