import {shell} from "electron";
import * as IpcApiFactory from "./IpcApiFactory";

IpcApiFactory.implementSyncApi( "openExternal", (url: string) => shell.openExternal(url));
