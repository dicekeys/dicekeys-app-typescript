import {RUNNING_IN_ELECTRON} from "../vite-build-constants";
export {RUNNING_IN_ELECTRON};

export type ValuesDefinedOnlyWhenRunningElectron<T, IS_RUNNING_IN_ELECTRON extends boolean = RUNNING_IN_ELECTRON> = {
  [P in keyof T]: IS_RUNNING_IN_ELECTRON extends true ? T[P] : undefined;
};