import React from "react";
import * as QRCode from "qrcode";
import { MobxObservedPromise } from "../../utilities/MobxObservedPromise";
import { observer } from "mobx-react";
import { ModalOverlayBetweenTopNavigationBarAndBottomIconBar } from "../../views/Navigation/NavigationLayout";
import { ButtonRow, PushButton } from "../../css/Button";
import styled from "styled-components"
import { action, makeAutoObservable } from "mobx";
import { Instruction2 } from "../../views/basics";

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

const QrContainerDiv = styled.div`
  margin-top: 1rem;
`

const QrTextContentsDiv = styled.div`
  font-family: monospace;
  font-size: 0.8rem;
  max-width: 80vw;
  word-wrap: normal;
  white-space: pre-wrap;
  margin-bottom: 1rem;
  font-weight: bold;
`;

type ReadVia = "ios" | "android" | "other" | undefined;

export class QrCodeOverlayState {
  readonly qrCodeSvgPromise: MobxObservedPromise<string>;

  readVia: ReadVia;
  setReadVia = action( (readVia: ReadVia) => this.readVia = readVia);
  setReadViaFn = (readVia: ReadVia) => () => this.setReadVia(readVia);

  warningDismissed: boolean = false;
  setWarningDismissed = action( () => this.warningDismissed = true );

  constructor(
    public readonly close: () => void,
    public readonly content: string,
    qrCodeOptions?: QRCode.QRCodeToStringOptions,
  ) {
    makeAutoObservable(this);
    this.qrCodeSvgPromise = QrCodeToSvgStringMobxObservedPromise(content, qrCodeOptions);
  }
}


export const QrCodeSvgContentView = observer (({state}: {
  state: QrCodeOverlayState
}) => state.qrCodeSvgPromise.fulfilled ? (<>
      <QrContainerDiv dangerouslySetInnerHTML={{__html: state.qrCodeSvgPromise.result ?? ""}}></QrContainerDiv>
      <QrTextContentsDiv>{ state.content }</QrTextContentsDiv>
      <ButtonRow><PushButton onClick={state.close}>Close</PushButton></ButtonRow>
    </>)
  : null
);

const FullLineButton = styled(PushButton)`
  width: 70vw;
`

const QRCodeOverlayDiv = styled(ModalOverlayBetweenTopNavigationBarAndBottomIconBar)`
  width: 80vw;
  padding-left: 10vw;
  padding-right: 10vw;
`

const SetReadViaButton = ({children, readVia, state}:
  {children: React.ComponentProps<typeof PushButton>["children"],
  state: QrCodeOverlayState,
  readVia: ReadVia
}) => (
  <FullLineButton onClick={state.setReadViaFn(readVia)}>{children}</FullLineButton>
)

export const QrCodeReaderTypeDialogView = observer (({state}: {
  state: QrCodeOverlayState,
}) => (
  <div>
    I will be reading this QR code with:
      <SetReadViaButton state={state} readVia="ios">The camera app on an iPhone or iPad</SetReadViaButton>
      <SetReadViaButton state={state} readVia="android">The camera app on an Android phone or tablet</SetReadViaButton>
      <SetReadViaButton state={state} readVia="other">A different app or device</SetReadViaButton>
  </div>
));

export const QrCodeReaderWarningForIosView = observer (({state}: {
  state: QrCodeOverlayState,
}) => (
  <div>
    <h3>Be careful: iPhone and iPads can leak to contents of QR codes</h3>

    <Instruction2>If you click on the contents, iOS will launch a web search,
      sending the secret in your QR code over the Internet to your search engine.
    </Instruction2>
    <Instruction2>To prevent this, once your QR code is scanned you will need to very carefully
      swipe your finger downward to cause iOS to expose the the copy option instead of searching.
    </Instruction2>
     
    <ButtonRow><PushButton onClick={state.setWarningDismissed}>I'll be careful</PushButton></ButtonRow>
  </div>
));

export const QrCodeOverlayView = observer( ({state}: {
  state: QrCodeOverlayState,
}) => {
//  const qrCodeSvgPromise = QrCodeToSvgStringMobxObservedPromise(content, qrCodeOptions);
  return (
      <QRCodeOverlayDiv>
        {state.readVia == null ?
          (<QrCodeReaderTypeDialogView state={state} />) :
        state.readVia === "ios" && !state.warningDismissed ?
          (<QrCodeReaderWarningForIosView state={state} />) :
          (<QrCodeSvgContentView state={state} />)  
        }
      </QRCodeOverlayDiv>
    )
});
