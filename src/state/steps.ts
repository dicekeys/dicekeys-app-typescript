import {
  DiceKey
} from "../dicekeys/dicekey";
import {
  ApiRequestContext
} from "../api-handler/handle-api-request";
import {
  ConsentResponse
} from "../api-handler/handle-api-request";
// import {
//   ApiCommandParameters,
//   SeedStringAndrecipeObjectForApprovedApiCommand
// } from "../api-handler/permission-checked-seed-accessor";
/**
 * Represent an application step that is awaiting completion as a promise
 * that returns a result when complete.
 */
class StepState<
  // The type of result to be returned by the promise on completion of the step
  RESULT = undefined,
  // The type of an options value that stores the state of the task request at the
  // start (e.g. the question to be asked of the user in a consent step)
  OPTIONS = undefined
> {
  /**
   * The options passed at the start made public and readonly via the [options] getter.
   */
  private _options?: OPTIONS;
  /**
   * The promise created when a step is initiated made public and readonly via the
   * [promise] getter.
   */
  private _promise?: Promise<RESULT>;
  /**
   * The resolve function returned by the promise constructor, which this
   * class makes accessible via its public complete function.
   */
  private resolvePromise?: (result: RESULT) => any;
  /**
   * The reject function returned by the promise constructor, which
   * this class makes accessible via its public cancel function.
   */
  private rejectPromise?: (e: any) => any;

  /**
   * Clear all internal state when a step completes
   */
  private clear() {
    this._promise = undefined;
    this.resolvePromise = undefined;
    this.rejectPromise = undefined;
  }

  /**
   * Complete the task
   * @param result The result of the task
   */
  public complete = (result: RESULT): void => {
    // Clear out the state before resolving the promise so that
    // any callbacks will see that this step is no longer in progress
    // if calling isInProgress
    const {resolvePromise} = this;
    this.clear();
    resolvePromise?.(result);
  }

  /**
   * Cancel the task
   * 
   * @param exception An exception indicating why the task was cancelled.
   */
  public cancel = (exception?: any): void => {
    // Clear out the state before rejecting the promise so that
    // any callbacks will see that this step is no longer in progress
    // if calling isInProgress
    const {rejectPromise} = this;
    this.clear();
    rejectPromise?.(exception);
  }

  /**
   * Start a task.

   * @param options Any data to attach to the task
   */
  public start(options?: OPTIONS) {
    this._options = options;
    return this._promise = new Promise<RESULT>( (resolve, reject) => {
      this.resolvePromise = resolve;
      this.rejectPromise = reject;
    })
  }

  /**
   * Returns true if the task is in progress
   */
  public get isInProgress() { return this._promise != null; }

  /**
   * Any options (parameters) passed to this task when it started
   */
  public get options(): OPTIONS {
    return this._options!;
  }

  /**
   * A promise that resolves when this task is complete or rejects
   * if this task is cancelled.
   */
  public get promise(): Promise<RESULT> | undefined {
    return this._promise!;
  }

}

/**
 * A step for loading a DiceKey into state
 */
export const loadDiceKey = new StepState<DiceKey, undefined>();

/**
 * A step for manually entering a DiceKey into state
 */
export const enterDiceKey = new StepState<DiceKey, undefined>();

/**
 * A step for obtaining user's consent.
 */
export const getUsersConsent = new StepState<ConsentResponse, ApiRequestContext>();
