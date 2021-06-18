/*
 * Copyright 2016 balena.io
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

import ipc from "node-ipc";
import * as os from 'os';
import * as path from 'path';
import {app, remote} from "electron";
import * as permissions from './permissions'

const THREADS_PER_CPU = 16;


/**
 * @summary Convert a JSON object to an Error object
 */
export function fromJSON(json: any): Error {
	return Object.assign(new Error(json.message), json);
}

export function getAppPath(): string {
	return (
		(app || remote.app)
			.getAppPath()
			// With macOS universal builds, getAppPath() returns the path to an app.asar file containing an index.js file which will
			// include the app-x64 or app-arm64 folder depending on the arch.
			// We don't care about the app.asar file, we want the actual folder.
			.replace(/\.asar$/, () =>
				process.platform === 'darwin' ? '-' + process.arch : '',
			)
	);
}


// There might be multiple Etcher instances running at
// the same time, therefore we must ensure each IPC
// server/client has a different name.
const IPC_SERVER_ID = `dicekeys-server-${process.pid}`;
const IPC_CLIENT_ID = `dicekeys-client-${process.pid}`;

ipc.config.id = IPC_SERVER_ID;
ipc.config.socketRoot = path.join(
	process.env.XDG_RUNTIME_DIR || os.tmpdir(),
	path.sep,
);

// NOTE: Ensure this isn't disabled, as it will cause
// the stdout maxBuffer size to be exceeded when flashing
ipc.config.silent = true;

function terminateServer() {
	// Turns out we need to destroy all sockets for
	// the server to actually close. Otherwise, it
	// just stops receiving any further connections,
	// but remains open if there are active ones.
	// @ts-ignore (no Server.sockets in @types/node-ipc)
	for (const socket of ipc.server.sockets) {
		socket.destroy();
	}
	ipc.server.stop();
}

function writerArgv(): string[] {
	let entryPoint = path.join(getAppPath(),'dist' ,'src', 'child-writer.js');
	// AppImages run over FUSE, so the files inside the mount point
	// can only be accessed by the user that mounted the AppImage.
	// This means we can't re-spawn Etcher as root from the same
	// mount-point, and as a workaround, we re-mount the original
	// AppImage as root.
	if (os.platform() === 'linux' && process.env.APPIMAGE && process.env.APPDIR) {
		entryPoint = entryPoint.replace(process.env.APPDIR, '');
		return [
			process.env.APPIMAGE,
			'-e',
			`require(\`\${process.env.APPDIR}${entryPoint}\`)`,
		];
	} else {
		return [process.argv[0], entryPoint];
	}
}

function writerEnv() {
	return {
		IPC_SERVER_ID,
		IPC_CLIENT_ID,
		IPC_SOCKET_ROOT: ipc.config.socketRoot,
		ELECTRON_RUN_AS_NODE: '1',
		UV_THREADPOOL_SIZE: (os.cpus().length * THREADS_PER_CPU).toString(),
		// This environment variable prevents the AppImages
		// desktop integration script from presenting the
		// "installation" dialog
		SKIP: '1',
		...(process.platform === 'win32' ? {} : process.env),
	};
}

interface FlashResults {
	skip?: boolean;
	cancelled?: boolean;
	results?: {
		bytesWritten: number;
		devices: {
			failed: number;
			successful: number;
		};
		errors: Error[];
	};
}

export async function performWrite(
	dummyData: string,
): Promise<{ cancelled?: boolean }> {
	let cancelled = false;
	let skip = false;
	console.log(ipc.config.socketRoot)
	console.log(ipc.config.id)
	console.log(ipc.server)
	ipc.serve();

	console.log(dummyData)

	return await new Promise((resolve, reject) => {
		ipc.server.on('error', (error) => {
			terminateServer();
			const errorObject = fromJSON(error);
			reject(errorObject);
		});

		ipc.server.on('log', (message) => {
			console.log(message);
		});

		const flashResults: FlashResults = {};

		ipc.server.on('fail', ({ error }) => {
			console.log('fail', error)
		});

		ipc.server.on('done', (event) => {
			console.log('done', event)
		});

		ipc.server.on('abort', () => {
			terminateServer();
			cancelled = true;
		});

		ipc.server.on('skip', () => {
			terminateServer();
			skip = true;
		});


		ipc.server.on('ready', (_data, socket) => {
			ipc.server.emit(socket, 'write', dummyData);
		});

		const argv = writerArgv();

		ipc.server.on('start', async () => {
			console.log(`Elevating command: ${argv.join(' ')}`);
			const env = writerEnv();
			try {
				const results = await permissions.elevateCommand(argv, {
					applicationName: 'dicekeys',
					environment: env,
				});
				flashResults.cancelled = cancelled || results.cancelled;
				flashResults.skip = skip;
			} catch (error) {
				// This happens when the child is killed using SIGKILL
				const SIGKILL_EXIT_CODE = 137;
				if (error.code === SIGKILL_EXIT_CODE) {
					error.code = 'ECHILDDIED';
				}
				reject(error);
			} finally {
				console.log('Terminating IPC server');
				terminateServer();
			}
			console.log('Flash results', flashResults);

			// The flash wasn't cancelled and we didn't get a 'done' event
			if (
				!flashResults.cancelled &&
				!flashResults.skip &&
				flashResults.results === undefined
			) {
				// @ts-ignore
				reject(
					{
						title: 'The writer process ended unexpectedly',
						description:
							'Please try again, and contact the Etcher team if the problem persists',
					},
				);
				return;
			}
			resolve(flashResults);
		});

		// Clear the update lock timer to prevent longer
		// flashing timing it out, and releasing the lock
		ipc.server.start();
	});
}

/**
 * @summary Cancel write operation
 */
export async function cancel(type: string) {
	const status = type.toLowerCase();

	try {
		// @ts-ignore (no Server.sockets in @types/node-ipc)
		const [socket] = ipc.server.sockets;
		if (socket !== undefined) {
			ipc.server.emit(socket, status);
		}
	} catch (error) {
		console.log(error)
	}
}
