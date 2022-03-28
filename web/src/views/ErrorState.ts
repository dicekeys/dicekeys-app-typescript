export interface ErrorState {
  error: Error | undefined;
  info: React.ErrorInfo | undefined;
}

// import React from "react";
// import { action, makeAutoObservable } from "mobx";

// export class ErrorState {
//   error: Error | undefined = undefined;
//   info: React.ErrorInfo | undefined = undefined;

//   setError = action ( (error: Error, info: React.ErrorInfo) => {
//     this.error = error;
//     this.info = info;
//   });

//   clearError = action ( () => {
//     this.error = undefined;
//     this.info = undefined;
//   });

//   constructor(error?: Error, info?: React.ErrorInfo) {
//     this.error = error;
//     this.info = info;
//     makeAutoObservable(this);
//   }
// };
