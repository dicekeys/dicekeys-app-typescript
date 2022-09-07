import React from "react";
import * as QRCode from "qrcode";
import { MobxObservedPromise } from "../../utilities/MobxObservedPromise";
import { Observer } from "mobx-react";
import { ModalOverlayBetweenTopNavigationBarAndBottomIconBar } from "../../views/Navigation/NavigationLayout";
import { ButtonRow, PushButton } from "../../css/Button";

export const QrCodeToSvgStringPromise = (content: string, options: QRCode.QRCodeToStringOptions={}) =>
  new Promise<string>( (resolve, reject) =>
    QRCode.toString(
      content,
      {
        // Default to highest level of error correction
        errorCorrectionLevel: "H",
        // default code to take up 2/3 window width or 1/2 height, whichever is smaller
        width: Math.round(Math.min(window.innerWidth / 2, window.innerHeight / 2)),
        // Caller's options override the above except for type 
        ...options,
        // Type must be SVG, since this is only for generating SVG strings
        type: "svg"
      },
      (err, svgStr) => {
        if (err != null) { reject(err) } else { resolve(svgStr); }
      }
));

export const QrCodeToSvgStringMobxObservedPromise = (content: string, options?: QRCode.QRCodeToStringOptions) =>
  new MobxObservedPromise(QrCodeToSvgStringPromise(content, options));

export const QrCodeSvgOverlayView = ({content, qrCodeOptions, close}: {
  content: string,
  qrCodeOptions?: QRCode.QRCodeToStringOptions,
  close: () => void,  
}) => {
  const s = QrCodeToSvgStringMobxObservedPromise(content, qrCodeOptions);
  return (
    <Observer>{ () => s.fulfilled ? (
      <ModalOverlayBetweenTopNavigationBarAndBottomIconBar>
        <div dangerouslySetInnerHTML={{__html: s.result ?? ""}}></div>
        <ButtonRow><PushButton onClick={close}>Close</PushButton></ButtonRow>
      </ModalOverlayBetweenTopNavigationBarAndBottomIconBar>
    ) : null }
  </Observer>
  )
}
