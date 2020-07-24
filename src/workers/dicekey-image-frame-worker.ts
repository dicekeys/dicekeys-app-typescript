import "core-js/stable";
import "regenerator-runtime/runtime";

// Hack to allow the webassembly module to load since it looks for window
// FUTURE - can this be removed with better use of emscripten to generate non-broken code?
// is this an artifact of the use of parcel when Stuart was testing this? 
(global as any).Window = (self as any).Window || self;

import {
    DiceKeyImageProcessor,
    DiceKeyImageProcessorModuleWithHelpers,
    DiceKeyImageProcessorModulePromise
} from "@dicekeys/read-dicekey-js"

/**
 * A request to process an image frame while scanning dicekeys
 */
interface RequestMetadata {
    sessionId: string;
}
interface Frame {
    width: number;
    height: number;
    rgbImageAsArrayBuffer: ArrayBufferLike;
}
export interface ProcessFrameRequest extends RequestMetadata, Frame {
    action: "processRGBAImageFrameAndRenderOverlay";
}
export interface ProcessAugmentFrameRequest extends RequestMetadata, Frame {
    action: "processAndAugmentRGBAImageFrame";
}

export interface TerminateSessionRequest {
    action: "terminateSession";
    sessionId: string;
}

export interface ReadyMessage {
    action: "workerReady"
}


/**
 * A response with the result of processing a camera frame
 * to look for a DiceKey
 */
export interface ProcessFrameResponse extends Frame, RequestMetadata {
    action: "processRGBAImageFrameAndRenderOverlay" | "processAndAugmentRGBAImageFrame";
    isFinished: boolean,
    diceKeyReadJson: string
}

function isTerminateSessionRequest(t: any) : t is TerminateSessionRequest {
    return typeof t === "object" &&
        "action" in t &&
        t.action === "terminateSession" &&
        "sessionId" in t;
}


function isProcessFrameRequest(t: any) : t is ProcessFrameRequest {
    return typeof t === "object" &&
        "action" in t &&
        (t.action === "processRGBAImageFrameAndRenderOverlay" || t.action === "processAndAugmentRGBAImageFrame") &&
        "sessionId" in t && "width" in t && "height" in t &&
        "rgbImageAsArrayBuffer" in t;
}

/**
 * This class implements the worker that processes image frames.
 * It is launched after the image-processing web assembly module is loaded
 */
class FrameProcessingWorker {
    private readonly module: DiceKeyImageProcessorModuleWithHelpers;
    private readonly sessionIdToImageProcessor = new Map<string, DiceKeyImageProcessor>();

    constructor(module: DiceKeyImageProcessorModuleWithHelpers) {
        this.module = module;
        addEventListener( "message", (requestMessage) => {
            if (isTerminateSessionRequest(requestMessage.data)) {
                this.sessionIdToImageProcessor.delete(requestMessage.data.sessionId);
            } else if (isProcessFrameRequest(requestMessage.data)) {
                const response = this.processRGBAImageFrameAndRenderOverlay(requestMessage.data);
                const transferableObjectsWithinResponse: Transferable[] = [
                    response.rgbImageAsArrayBuffer
                ];
                // TypeScript hack since it doesn't understand this is a worker and StackOverflow
                // posts make it look hard to convince it otherwise.
                (self as unknown as {postMessage: (m: any, t?: Transferable[]) => unknown}).postMessage(response, transferableObjectsWithinResponse);
            }
        });
        (self as unknown as {postMessage: (m: any, t?: Transferable[]) => unknown}).postMessage({action: "workerReady"} as ReadyMessage);
    }

    processRGBAImageFrameAndRenderOverlay = ({
        action, sessionId, width, height,
        rgbImageAsArrayBuffer: inputRgbImageAsArrayBuffer
      }: ProcessFrameRequest | ProcessAugmentFrameRequest
    ): ProcessFrameResponse => {
      const rgbImagesArrayUint8Array = new Uint8Array(inputRgbImageAsArrayBuffer);
        if (!this.sessionIdToImageProcessor.has(sessionId)) {
            this.sessionIdToImageProcessor.set(sessionId, new this.module.DiceKeyImageProcessor());
        }
        const diceKeyImageProcessor = this.sessionIdToImageProcessor.get(sessionId)!;

//        const inputDataBuffer = new Uint8ClampedArray(inputRgbImageAsArrayBuffer);

        if (action === "processRGBAImageFrameAndRenderOverlay") {
          diceKeyImageProcessor.processRGBAImageAndRenderOverlay(width, height, rgbImagesArrayUint8Array)
        } else { // if (action === "processAndAugmentRGBAImageFrame") ?
          diceKeyImageProcessor.processAndAugmentRGBAImage(width, height, rgbImagesArrayUint8Array);
        }

        const isFinished = diceKeyImageProcessor.isFinished();
        const diceKeyReadJson =  diceKeyImageProcessor.diceKeyReadJson();

  
        return {
            action, sessionId, height, width,
            rgbImageAsArrayBuffer: rgbImagesArrayUint8Array.buffer,
            isFinished,
            diceKeyReadJson
        }
    }
}

// Create the worker once the required webassembly has been created.
DiceKeyImageProcessorModulePromise.then( module => new FrameProcessingWorker(module) );
