/*
 * Copyright 2017 balena.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as childProcess from 'child_process';
import { promises as fs } from 'fs';
import * as _ from 'lodash';
import * as os from 'os';
import * as sudoPrompt from 'sudo-prompt';
import { promisify } from 'util';
import {withTmpFile} from "./tmp";

const execAsync = promisify(childProcess.exec);
const execFileAsync = promisify(childProcess.execFile);

function sudoExecAsync(
	cmd: string,
	options: { name: string },
): Promise<{ stdout: string; stderr: string }> {
	return new Promise((resolve, reject) => {
		sudoPrompt.exec(
			cmd,
			options,
			(error?: Error, stdout?: string | Buffer, stderr?: string | Buffer) => {
				if (error != null) {
					reject(error);
				} else {
					let out: string = stdout as string;
					let err: string = stderr as string;

					resolve({ stdout: out, stderr: err });
				}
			},
		);
	});
}

/**
 * @summary The user id of the UNIX "superuser"
 */
const UNIX_SUPERUSER_USER_ID = 0;

export async function isElevated(): Promise<boolean> {
	if (os.platform() === 'win32') {
		// `fltmc` is available on WinPE, XP, Vista, 7, 8, and 10
		// Works even when the "Server" service is disabled
		// See http://stackoverflow.com/a/28268802
		try {
			await execAsync('fltmc');
		} catch (error) {
			if (error.code === os.constants.errno.EPERM) {
				return false;
			}
			throw error;
		}
		return true;
	}
	// return process.geteuid() === UNIX_SUPERUSER_USER_ID;
	// For our use case is find
	return true;
}

/**
 * @summary Check if the current process is running with elevated permissions
 */
export function isElevatedUnixSync(): boolean {
	return process.geteuid() === UNIX_SUPERUSER_USER_ID;
}

function escapeSh(value: any): string {
	// Make sure it's a string
	// Replace ' -> '\'' (closing quote, escaped quote, opening quote)
	// Surround with quotes
	return `'${String(value).replace(/'/g, "'\\''")}'`;
}

function escapeParamCmd(value: any): string {
	// Make sure it's a string
	// Escape " -> \"
	// Surround with double quotes
	return `"${String(value).replace(/"/g, '\\"')}"`;
}

function setEnvVarSh(value: any, name: string): string {
	return `export ${name}=${escapeSh(value)}`;
}

function setEnvVarCmd(value: any, name: string): string {
	return `set "${name}=${String(value)}"`;
}

// Exported for tests
export function createLaunchScript(
	command: string,
	argv: string[],
	environment: _.Dictionary<string | undefined>,
): string {
	const isWindows = os.platform() === 'win32';
	const lines = [];
	if (isWindows) {
		// Switch to utf8
		lines.push('chcp 65001');
	}
	const [setEnvVarFn, escapeFn] = isWindows
		? [setEnvVarCmd, escapeParamCmd]
		: [setEnvVarSh, escapeSh];
	lines.push(..._.map(environment, setEnvVarFn));
	lines.push([command, ...argv].map(escapeFn).join(' '));
	return lines.join(os.EOL);
}

async function elevateScriptWindows(
	path: string,
	name: string,
): Promise<{ cancelled: false }> {
	// '&' needs to be escaped here (but not when written to a .cmd file)
	const cmd = ['cmd', '/c', escapeParamCmd(path).replace(/&/g, '^&')].join(' ');
	await sudoExecAsync(cmd, { name });
	return { cancelled: false };
}

export async function elevateCommand(
	command: string[],
	options: {
		environment: _.Dictionary<string | undefined>;
		applicationName: string;
	},
): Promise<{ cancelled: boolean }> {
	if (await isElevated()) {
		await execFileAsync(command[0], command.slice(1), {
			env: options.environment,
		});
		return { cancelled: false };
	}
	const launchScript = createLaunchScript(
		command[0],
		command.slice(1),
		options.environment,
	);
	return await withTmpFile(
		{
			keepOpen: false,
			prefix: 'dicekeys-electron-',
			postfix: '.cmd',
		},
		async ({ path }) => {
			await fs.writeFile(path, launchScript);
			return elevateScriptWindows(path, options.applicationName);
		},
	);
}
