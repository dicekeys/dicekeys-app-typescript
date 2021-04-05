// import styles from "./camera-capture.module.css";
// import React from "react";

// // import {
// // //  getElementDimensions,
// //   Component, Attributes,
// //   Canvas,
// //   Div,
// //   Select,
// //   Option,
// //   Video, ComponentEvent
// // } from "../../web-component-framework";
// import {
//   CamerasBeingInspected
// } from "./cameras-being-inspected";
// import {
//   Camera,
//   CamerasOnThisDevice,
// //  videoConstraintsForDevice
// } from "./cameras-on-this-device";
// import { browserInfo } from "../../utilities/browser";
// // import { CenteredControls } from "../basics";
// import { action, autorun, makeAutoObservable, runInAction } from "mobx";
// import { observer } from "mobx-react";
// import { OverlayCanvas } from "~web-components/basics/overlay-canvas";
// import { createReactObservableBounds, MakeThisElementsBoundsObservable } from "~web-components/basics/bounds";
// import { withDefined, withNonNull } from "~utilities/if-defined";
// import { FrameGrabber } from "./frame-grabber";

// class ReadDiceKeyFrameListener {
//   private frameWorker: Worker;

//   public resolveWorkerReadyPromise: undefined | ((result: boolean) => void);
//   private readonly workerReadyPromise: Promise<boolean>;

//   private nextRequestId = 1;
//   frameCompeteListeners: (() => any)[] = [];

//   private readyReceived: boolean = false;
//   handleMessage = (message: MessageEvent) => {
//     if (!this.readyReceived && "action" in message.data && message.data.action === "workerReady" ) {
//       this.readyReceived = true;
//       this.resolveWorkerReadyPromise?.(true);
//     } else if ("action" in message.data &&
//       message.data.action === "processRGBAImageFrame"
//     ) {
//       this.handleProcessedCameraFrame(message.data as ProcessFrameResponse )
//     }
//   }

//   constructor(private onDiceKeyRead: ( (diceKey: DiceKey) => any )) {
//     this.frameWorker = new Worker('../../workers/dicekey-image-frame-worker.ts');
//     this.frameWorker.addEventListener( "message", this.handleMessage );
//   }
  
// const processCameraFrame = async (imageData: ImageData) => {
//   // make sure never to send the frame until the worker is ready
//   try {
//     await Promise.all([this.workerReadyPromise]);
//   } catch (e) {
//     console.log("Exception at start of processing", e);
//   }
//   const requestId = this.nextRequestId++;
//   const {width, height, data} = imageData;
//   // Create a copy of the image buffer that can be sent over to the worker
//   const rgbImageAsArrayBuffer = data.buffer.slice(0);
//   // Ask the background worker to process the bitmap.
//   // First construct a request
//   const request: ProcessFrameRequest = {
//     requestId,
//     width, height, rgbImageAsArrayBuffer,
//     action: "processRGBAImageFrame",
//     sessionId: this.cameraSessionId!,
//   };
//   // The mark the objects that can be transferred to the worker.
//   // This eliminates the need to copy the big memory buffer over, but the worker will now own the memory.
//   const transferrableObjectsWithinRequest: Transferable[] =  [request.rgbImageAsArrayBuffer];
//   // Send the request to the worker
//   this.frameWorker.postMessage(request, transferrableObjectsWithinRequest);
// }

// /**
//  * This component scans scans images using the device camera(s).
//  * 
//  * When possible, it will use the ImageCapture interface to grab frames
//  * at a resolution that's high enough to minimize the impact of errors
//  * while low enough to not make processing intolerably slow.
//  * Typically 768x768 or 1024x1024 (square units to fit a square DiceKey).
//  * 
//  * ## Implementation notes
//  * This component will always render a Video element, even though that Video
//  * element will not be displayed when we're grabbing frames using
//  * ImageCapture and rendering them by drawing them to a canvas.
//  * If we don't send the camera data to a video element and grab frames too
//  * slowly, some browsers will mute the camera image.  Ensuring the camera
//  * stream is always sent to a video element, even if that video element
//  * is not rendered, seems to address that problem.
//  */

//   // componentWillUnmount() {
//   //   this.props
//   //   if (this.htmlVideoElement) {
//   //     setVideosMediaStream(this.htmlVideoElement, undefined);
//   //   }
//   // }


// /*


//   render() {
//     if (this.cameras.length == 0) {
//       if (CamerasOnThisDevice.instance.ready) {
//         // We've loaded all the cameras and found there are none
//         return (
//           <div style={{color: "#ff8080", fontSize: "1.75rem", maxWidth: "70vw"}}>
//             Either no cameras are connected or your browser is denying access to them.
//             <br/>
//             <br/>
//             Please make sure cameras are connected, no other apps are using them, and that the app is permitted to access them.
//             <br/>
//             Then press the refresh button in your browser.
//           </div>
//         );
//       } else {
//         // We're still loading the cameras
//         return (
//           <CamerasBeingInspected />
//         )
//       }
//     } else {
//       // Render an overlay and a camera for the video experience
//       const [videoElementBounds, setVideoElementRefForBounds] = createReactObservableBounds();
//       return (
//         <div>
//           <div>
//             <video ref={ e => { this.videoElement = e; setVideoElementRefForBounds(e) } }/>
//             <OverlayCanvas bounds={videoElementBounds} ref={ e => this.overlayCanvasElement = e } />
//           </div>
//           { // only show a camera selection menu if there's more than one camera to choose from
//             this.cameras.length <= 1 ? null : (
//             <CenteredControls>
//               <select value={this.camerasDeviceId} onChange={ e => this.setCameraByDeviceId(e.target.value) }>
//                 {CamerasOnThisDevice.instance.cameras.map( camera => (
//                 <option key={camera.deviceId} value={camera.deviceId}>{camera.name}</option>
//                 ))}
//               </select>
//             </CenteredControls>
//           )}
//         </div>
//       );
//     }
//   }
// */

// class ToDoStuff {
//   setCameraByDeviceId = action ( (deviceId: string | undefined ) => {
//     if (deviceId == null) {
//       return;
//     }
//     const camera = CamerasOnThisDevice.instance.camerasByDeviceId.get(deviceId);
//     if (camera) {
//       this.setCamera(camera);
//     }
//   });

//   setCamera = action ( (camera: Camera) => {
//     const {deviceId} = camera;
//     const ideal = browserInfo.browser === "Safari" ? 1080: 1024;
//     if (camera) {
//       this.setCameraByConstraints({
//         deviceId,
//         width: {
//           ideal,
// //          ideal: Math.min(camera.capabilities?.width?.max ?? defaultCameraDimensions.width, defaultCameraDimensions.width),
//           max: 1280,
// //          min: 640,
//         },
//         height: {
// //          ideal: Math.min(camera.capabilities?.height?.max ?? defaultCameraDimensions.height, defaultCameraDimensions.height),
//           ideal,
//           max: 1280,
// //          min: 640
//         },
//         aspectRatio: {ideal: 1},
//         // advanced: [{focusDistance: {ideal: 0}}]
//       });
//     }
//   });

//   private throwIfTrackNotReadable = (track: MediaStreamTrack | undefined): void => {
//     if (track == null) {
//       throw new Error("Cannot set camera because track is null.");
//     }
//     if (track.readyState !== "live") {
//       throw new Error("Cannot set camera because track is not in live state.");
//     }
//     if (!track.enabled) {
//       throw new Error("Cannot set camera because track is not enabled.");
//     }
//   }

//   // private throwIfTrackNotReadableOrMuted = (track: MediaStreamTrack | undefined): void => {
//   //   this.throwIfTrackNotReadable(track);
//   //   if (track?.muted ) {
//   //     throw new Error("Cannot set camera because track is muted.");
//   //   }
//   // }

//   /**
//    * Set the current camera
//    */



// }

// /*


// const setVideosMediaStream = (
//   videoElement?: HTMLVideoElement | null,
//   mediaStream?: MediaProvider | null
// ): void => {
//     if (!videoElement) {
//       return;
//     }
//     const oldMediaStream = videoElement.srcObject;
//     if (mediaStream == oldMediaStream) return;
//     if (oldMediaStream && "getVideoTracks" in oldMediaStream) {
//       oldMediaStream?.getVideoTracks().forEach(track => {
//       //      if (track.readyState === "live" && track.enabled) {
//       try {
//         track.stop();
//       } catch (e) {
//         console.log("Exception stopping track", e);
//       }
//       //      }
//       });        
//     }
//     if (oldMediaStream && "stop" in oldMediaStream) {
//         // try for firefox
//       oldMediaStream?.stop?.();
//     }
//     videoElement.srcObject = mediaStream ?? null;
// };
// */