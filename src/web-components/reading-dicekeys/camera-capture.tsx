import React from "react";
import { action, autorun, makeAutoObservable, runInAction } from "mobx";
import { observer } from "mobx-react";
import { MakeThisElementsBoundsObservable } from "~web-components/basics/bounds";
import { FrameGrabber } from "./frame-grabber";

export const imageCaptureSupported: boolean = (typeof ImageCapture === "function");

export class MediaStreamState {
  private mediaStreamReadWrite?: MediaStream;

  get mediaStream(): MediaStream | undefined {
    return this.mediaStreamReadWrite ?? undefined;
  }

  clearMediaStream = action (() => {
    if (this.mediaStreamReadWrite) {
      this.mediaStreamReadWrite?.getVideoTracks().forEach(track => {
        try { track.stop(); } catch {}
      });
      try {this.mediaStreamReadWrite.stop?.()} catch {}
      this.mediaStreamReadWrite = undefined;
    }
  });

  setMediaStream = action ((mediaStream?: MediaStream) => {
    if (this.mediaStreamReadWrite === mediaStream) return;
    this.clearMediaStream();
    this.mediaStreamReadWrite = mediaStream;
  });

  setMediaStreamFromConstraints = action ( (mediaTrackConstraints?: MediaTrackConstraints): void => {
    navigator.mediaDevices.getUserMedia({video: mediaTrackConstraints}).then(      
      (mediaStream) => runInAction( () => {
          this.mediaStreamReadWrite = mediaStream;
        }
      ));
  });

  constructor() {
    makeAutoObservable(this);
  }
}

export interface CameraCaptureProperties {
  mediaStreamState?: MediaStreamState;
  onVideoElementRef?: (e: HTMLVideoElement | null) => any;
  onFrameCaptured?: (frame: ImageData) => any;
  makeThisElementsBoundsObservable?: MakeThisElementsBoundsObservable;
}

export const CameraCapture = observer ( (props: React.PropsWithoutRef<CameraCaptureProperties>) => {
  const frameGrabber = new FrameGrabber(props.onFrameCaptured);

  const withVideoElementRef = (videoElement: HTMLVideoElement) => autorun( () => {
    props.onVideoElementRef?.(videoElement);
    props.makeThisElementsBoundsObservable?.(videoElement);
    frameGrabber.setVideoElement(videoElement);
    if (videoElement) {
      videoElement.srcObject = (props.mediaStreamState?.mediaStream ?? null );
    }
  });

  return (
    <video ref={withVideoElementRef} />
  )
});