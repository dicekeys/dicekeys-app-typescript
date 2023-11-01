type CALLBACK<ARGS extends unknown[], RESULT=unknown> = (...args: ARGS) => RESULT;

export class CustomEvent<ARGS extends unknown[] = [], TARGET_TYPE = unknown> {
  private callbacks = new Set<CALLBACK<ARGS>>();

  constructor(protected target: TARGET_TYPE) {}
  
  on = (callback: CALLBACK<ARGS>): TARGET_TYPE => {
    this.callbacks.add(callback);
    return this.target;
  }

  onOnce = (callback: CALLBACK<ARGS>): TARGET_TYPE => {
    const removeWhenCalled: CALLBACK<ARGS> = (...args: ARGS) => {
      this.remove(removeWhenCalled);
      callback(...args);
    }
    return this.on(removeWhenCalled);
  }

  onUntilReturnsTrue = (callback: CALLBACK<ARGS>): TARGET_TYPE => {
    const removeIfCallbackReturnsTrue: CALLBACK<ARGS> = async (...args: ARGS) => {
      if ((await callback(...args)) === true) {
          this.remove(removeIfCallbackReturnsTrue);
      }
    }
    return this.on(removeIfCallbackReturnsTrue);
  }
  
  promiseOfNextOccurrenceMultipleArgs = (requireNextOccurrenceToMeetThisFilterCondition?: (...args: ARGS) => boolean): Promise<ARGS> => new Promise<ARGS>( (resolve, _reject) => {
    const resolveWhenCallbackReturnsTrue: CALLBACK<ARGS> = (...args: ARGS) => {
      if (!requireNextOccurrenceToMeetThisFilterCondition || requireNextOccurrenceToMeetThisFilterCondition(...args)) {
          this.remove(resolveWhenCallbackReturnsTrue);
          resolve(args)
      }
    }
    return this.on(resolveWhenCallbackReturnsTrue);
  })

  promiseOfNextOccurrence = (requireNextOccurrenceToMeetThisFilterCondition?: (...args: ARGS) => boolean): Promise<ARGS[0]> =>
    this.promiseOfNextOccurrenceMultipleArgs(requireNextOccurrenceToMeetThisFilterCondition).then( args => args[0] );

  remove = (callback: CALLBACK<ARGS>) => {
    this.callbacks.delete(callback);
    return this.target;
  }

  removeAll = () => {
    this.callbacks.clear();
  }

  /**
   * Sends an event immediately without waiting for the caller to exit.
   */
  sendImmediately = (...args: ARGS) => {
    this.callbacks.forEach( callback => {
      try { callback(...args ) } catch {}
    });
    return this.target;
  }

  /**
   * Sends an event from outside the caller when the javascript engine
   * next has a free cycle.
   */
   sendEventually = (...args: ARGS) => {
    const {callbacks} = this;
    setTimeout( () => {
      callbacks.forEach( callback => {
        try { callback(...args ) } catch {}
      });
    }, 0);
    return this.target;
  }


}
