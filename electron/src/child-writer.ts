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


import * as ipc from 'node-ipc';


ipc.config.id = process.env.IPC_CLIENT_ID as string;
ipc.config.socketRoot = process.env.IPC_SOCKET_ROOT as string;

// NOTE: Ensure this isn't disabled, as it will cause
// the stdout maxBuffer size to be exceeded when flashing
ipc.config.silent = true;

// > If set to 0, the client will NOT try to reconnect.
// See https://github.com/RIAEvangelist/node-ipc/
//
// The purpose behind this change is for this process
// to emit a "disconnect" event as soon as the GUI
// process is closed, so we can kill this process as well.
// @ts-ignore (0 is a valid value for stopRetrying and is not the same as false)
ipc.config.stopRetrying = 0;

const DISCONNECT_DELAY = 100;
const IPC_SERVER_ID = process.env.IPC_SERVER_ID as string;

export const SUCCESS = 0;
export const GENERAL_ERROR = 1;
export const VALIDATION_ERROR = 2;
export const CANCELLED = 3;

export async function delay(duration: number): Promise<void> {
	await new Promise((resolve) => {
		setTimeout(resolve, duration);
	});
}

function toJSON(
	error: Error & {
		description?: string;
		report?: boolean;
		code?: string;
		syscall?: string;
		errno?: number;
		stdout?: string;
		stderr?: string;
		device?: string;
	},
): any {
	return {
		name: error.name,
		message: error.message,
		description: error.description,
		stack: error.stack,
		report: error.report,
		code: error.code,
		syscall: error.syscall,
		errno: error.errno,
		stdout: error.stdout,
		stderr: error.stderr,
		device: error.device,
	};
}

/**
 * @summary Send a log debug message to the IPC server
 */
function log(message: string) {
	ipc.of[IPC_SERVER_ID].emit('log', message);
}

/**
 * @summary Terminate the child writer process
 */
async function terminate(exitCode: number) {
	ipc.disconnect(IPC_SERVER_ID);
	process.nextTick(() => {
		process.exit(exitCode || SUCCESS);
	});
}

/**
 * @summary Handle a child writer error
 */
async function handleError(error: Error) {
	ipc.of[IPC_SERVER_ID].emit('error', toJSON(error));
	await delay(DISCONNECT_DELAY);
	await terminate(GENERAL_ERROR);
}

export interface FlashError extends Error {
	description: string;
	device: string;
	code: string;
}

export interface WriteResult {
	bytesWritten?: number;
	devices?: {
		failed: number;
		successful: number;
	};
	errors: FlashError[];
}

export interface FlashResults extends WriteResult {
	skip?: boolean;
	cancelled?: boolean;
}

ipc.connectTo(IPC_SERVER_ID, () => {
	// Remove leftover tmp files older than 1 hour
	process.once('uncaughtException', handleError);

	// Gracefully exit on the following cases. If the parent
	// process detects that child exit successfully but
	// no flashing information is available, then it will
	// assume that the child died halfway through.

	process.once('SIGINT', async () => {
		await terminate(SUCCESS);
	});

	process.once('SIGTERM', async () => {
		await terminate(SUCCESS);
	});

	// The IPC server failed. Abort.
	ipc.of[IPC_SERVER_ID].on('error', async () => {
		await terminate(SUCCESS);
	});

	// The IPC server was disconnected. Abort.
	ipc.of[IPC_SERVER_ID].on('disconnect', async () => {
		await terminate(SUCCESS);
	});

	ipc.of[IPC_SERVER_ID].on('write', async (data: string) => {

		console.log(data)


		let exitCode = SUCCESS;

		/**
		 * @summary Abort handler
		 * @example
		 * writer.on('abort', onAbort)
		 */
		const onAbort = async () => {
			log('Abort');
			ipc.of[IPC_SERVER_ID].emit('abort');
			await delay(DISCONNECT_DELAY);
			await terminate(exitCode);
		};

		const onSkip = async () => {
			log('Skip validation');
			ipc.of[IPC_SERVER_ID].emit('skip');
			await delay(DISCONNECT_DELAY);
			await terminate(exitCode);
		};

		ipc.of[IPC_SERVER_ID].on('cancel', onAbort);

		ipc.of[IPC_SERVER_ID].on('skip', onSkip);

		/**
		 * @summary Failure handler (non-fatal errors)
		 * @param {SourceDestination} destination - destination
		 * @param {Error} error - error
		 * @example
		 * writer.on('fail', onFail)
		 */
		try{

			ipc.of[IPC_SERVER_ID].emit('done', { data : "FROM ELEVATED COMMAND" });
			await delay(DISCONNECT_DELAY);
			await terminate(exitCode);
		} catch (error) {
			exitCode = GENERAL_ERROR;
			ipc.of[IPC_SERVER_ID].emit('error', toJSON(error));
		}
	});

	ipc.of[IPC_SERVER_ID].on('connect', () => {
		log(
			`Successfully connected to IPC server: ${IPC_SERVER_ID}, socket root ${ipc.config.socketRoot}`,
		);
		ipc.of[IPC_SERVER_ID].emit('ready', {});
	});
});
