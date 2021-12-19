declare var VITE_SET_APP_RUNNING_IN_ELECTRON: boolean | undefined;
export const RUNNING_IN_ELECTRON: boolean = (typeof VITE_SET_APP_RUNNING_IN_ELECTRON !== "undefined") ? !!VITE_SET_APP_RUNNING_IN_ELECTRON : false;
export type RUNNING_IN_ELECTRON = typeof RUNNING_IN_ELECTRON;

declare var VITE_BUILD_DATE: string;
declare var VITE_BUILD_VERSION: string;

export const BUILD_DATE = VITE_BUILD_DATE;
export const BUILD_VERSION = VITE_BUILD_VERSION;
