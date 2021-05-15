import {
    ProcessFrameResponse,
    ProcessFrameRequest
} from "../../workers/dicekey-image-frame-worker"
import { CustomEvent } from "../../utilities/event";
export const imageCaptureSupported: boolean = (typeof ImageCapture === "function");


class DiceKeyFrameWorkerClient {
  /**
   * A session id for the current camera stream
   */
  private cameraSessionId: string = Math.random().toString() + Math.random().toString();
  private readonly workerReadyPromise: Promise<boolean>;

  /**
   * The background worker that processes image frames so that the
   * UI thread is not delayed by their processing.
   */
  private readonly frameWorker: Worker;
  private workerMessageReceivedEvent: CustomEvent<[MessageEvent]>;
  private nextRequestId = 1;


  /**
   * The code supporting the demo page cannot until the WebAssembly module for the user
   * processor has been loaded. Pass the module to wire up the page with this class.
   * @param module The web assembly module that implements the DiceKey image processing.
   */
  constructor() {
    // Create an event for receiving messages from the worker process
    this.workerMessageReceivedEvent = new CustomEvent(this);
    // Create the worker for processing camera frames
    this.frameWorker = new Worker('../../workers/dicekey-image-frame-worker.ts');
    // this.frameWorker = new Worker(new URL('../../workers/dicekey-image-frame-worker.ts'/*,  import.meta.url */ ));
    // Attach the message-received event to the worker
    this.frameWorker.addEventListener( "message", this.workerMessageReceivedEvent.send );
    // Use a promise to track when the worker has sent us its ready message
    this.workerReadyPromise = this.workerMessageReceivedEvent.promiseOfNextOccurrenceMultipleArgs( 
      message => ("action" in message.data && message.data.action === "workerReady" )
    ).then( () => true );
  }

  cleanUp = () => {
    // If there's an existing stream, terminate it
    // this.frameWorker.removeEventListener( "message", this.handleMessage );
    // this.frameWorker.postMessage({action: "terminateSession", sessionId: this.cameraSessionId} as TerminateSessionRequest);
    this.frameWorker.terminate();
  }

  processDiceKeyImageFrame = async (imageData: ImageData): Promise<ProcessFrameResponse> => {
    await this.workerReadyPromise;
    const requestId = this.nextRequestId++;
    const {width, height, data} = imageData;
    // Create a copy of the image buffer that can be sent over to the worker
    const rgbImageAsArrayBuffer = data.buffer.slice(0);
    // Ask the background worker to process the bitmap.
    // First construct a request
    const request: ProcessFrameRequest = {
      action: "processRGBAImageFrame",
      sessionId: this.cameraSessionId,
      requestId,
      width, height,
      rgbImageAsArrayBuffer,
    };
    // The mark the objects that can be transferred to the worker.
    // This eliminates the need to copy the big memory buffer over, but the worker will now own the memory.
    const transferrableObjectsWithinRequest: Transferable[] = []; // [request.rgbImageAsArrayBuffer];
    // Send the request to the worker
    this.frameWorker.postMessage(request, transferrableObjectsWithinRequest);
    const response = (await this.workerMessageReceivedEvent.promiseOfNextOccurrence(
      message => "action" in message.data && message.data.action === "processRGBAImageFrame" 
    )).data as ProcessFrameResponse;
    return response;
  }
}
const frameWorker = new DiceKeyFrameWorkerClient(); 
export const processDiceKeyImageFrame = frameWorker.processDiceKeyImageFrame;
