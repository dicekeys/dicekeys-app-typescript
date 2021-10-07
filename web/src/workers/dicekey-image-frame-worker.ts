import "core-js/stable";
// import "regenerator-runtime/runtime";

// Hack to allow the webassembly module to load since it looks for window
// FUTURE - can this be removed with better use of emscripten to generate non-broken code?
// is this an artifact of the use of parcel when Stuart was testing this? 
// (global as any).Window = (self as any).Window || self;

import {
    DiceKeyImageProcessor,
    DiceKeyImageProcessorModuleWithHelpers,
    DiceKeyImageProcessorModulePromise, FaceRead
} from "@dicekeys/read-dicekey-js"
import { TupleOf25Items } from "../dicekeys/DiceKey";
import { FaceReadJsonObjectWithImageIfErrorFound } from "../dicekeys";

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
  requestId: number;
  action: "processRGBAImageFrame";
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
export interface ProcessFrameResponse extends RequestMetadata {
  width: number;
  height: number;
  requestId: number;
  action: "processRGBAImageFrame";
  isFinished: boolean,
  facesReadObjectArray: TupleOf25Items<FaceReadJsonObjectWithImageIfErrorFound> | undefined,
  exception?: Error;
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
        (t.action === "processRGBAImageFrame") &&
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
                const response = this.processRGBAImageFrame(requestMessage.data);
                const transferableObjectsWithinResponse: Transferable[] = [
                ];
                // TypeScript hack since it doesn't understand this is a worker and StackOverflow
                // posts make it look hard to convince it otherwise.
                (self as unknown as {postMessage: (m: any, t?: Transferable[]) => unknown}).postMessage(response, transferableObjectsWithinResponse);
            }
        });
        (self as unknown as {postMessage: (m: any, t?: Transferable[]) => unknown}).postMessage({action: "workerReady"} as ReadyMessage);
    }

    processRGBAImageFrame = ({
        requestId,
        action, sessionId, width, height,
        rgbImageAsArrayBuffer: inputRgbImageAsArrayBuffer
      }: ProcessFrameRequest
    ): ProcessFrameResponse => {
      try {
      const rgbImagesArrayUint8Array = new Uint8Array(inputRgbImageAsArrayBuffer);
        if (!this.sessionIdToImageProcessor.has(sessionId)) {
            this.sessionIdToImageProcessor.set(sessionId, new this.module.DiceKeyImageProcessor());
        }
        const diceKeyImageProcessor = this.sessionIdToImageProcessor.get(sessionId)!;

        // console.log("Worker starts processing frame", (Date.now() % 100000) / 1000);
        try {
          diceKeyImageProcessor.processRGBAImage(width, height, rgbImagesArrayUint8Array)
        } catch (e) {
          if (typeof e === "string") {
            throw new Error("Error in processImage: " + e);
          } else {
            throw e;
          }
        }
    // console.log("Worker finishes processing frame", (Date.now() % 100000) / 1000);

        const isFinished = diceKeyImageProcessor.isFinished();
        const facesReadJsonObj =  (JSON.parse(diceKeyImageProcessor.diceKeyReadJson()) ?? []) as FaceReadJsonObjectWithImageIfErrorFound[];
        facesReadJsonObj.forEach( (faceReadJsonObj, faceIndex) => {
          const faceRead = FaceRead.fromJsonObject(faceReadJsonObj);
          if (faceRead.errors && faceRead.errors.length > 0) {
            try {
              const faceReadImageDataFromCpp = diceKeyImageProcessor.getFaceImage(faceIndex);
              const faceReadImageData = new Uint8ClampedArray(faceReadImageDataFromCpp);
              faceReadJsonObj.squareImageAsRgbaArray = new Uint8ClampedArray(faceReadImageData);
            } catch (e) {
              if (typeof e === "string") {
                throw new Error("Error in getFaceImage: " + e);
              } else {
                throw e;
              }
            }
          }
        });

          

  
        return {
          requestId,
          action, sessionId, height, width,
          isFinished,
          facesReadObjectArray: facesReadJsonObj.length === 25 ? facesReadJsonObj as TupleOf25Items<FaceReadJsonObjectWithImageIfErrorFound> : undefined,
        }
    } catch (exception) {
      if (typeof exception === "string") {
        try {throw new Error(exception)} catch (newE) {exception = newE}
      }
      if (!(exception instanceof Error)) {
        try {throw new Error(JSON.stringify(exception))} catch (newE) {exception = newE}
      }
      return {
        requestId,
        action, sessionId, height, width,
        isFinished: false,
        facesReadObjectArray: undefined,
        exception: exception as (Error | undefined)
      }
    }
  }
}

// Create the worker once the required webassembly has been created.
DiceKeyImageProcessorModulePromise.then( module => new FrameProcessingWorker(module) );
