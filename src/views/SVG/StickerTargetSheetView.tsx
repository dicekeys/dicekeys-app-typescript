import React from "react";
import { observer } from "mobx-react";
import { DiceKey } from "../../dicekeys/DiceKey";
import { FaceGroupView } from "./FaceView";

const FaceTargetPlaceholderSvgGroup = (props: {linearSizeOfFace: number} & React.SVGAttributes<SVGElement>) => {
  const {linearSizeOfFace, ...otherProps} = props;
  const centerWhiteSquareSize = linearSizeOfFace * 0.75;
  const darker = "#D0D0D0";
  const lighter = "#FEFEFE";
  const lightest = "#F8F8F8";
  const p1 = linearSizeOfFace/2;
  const p0 = -p1; 
  const style={stroke: darker, strokeWidth: linearSizeOfFace/40} as const;
  return (<g {...otherProps} >
  <line style={style}
    x1={0} x2={0}
    y1={p0} y2={p1}
  />
  <line style={style}
    x1={p0} x2={p1}
    y1={0} y2={0}
  />
  <line style={style}
    x1={p0} x2={p1}
    y1={p0} y2={p1}
  />
  <line style={style}
    x1={p0} x2={p1}
    y1={p1} y2={p0}
  />
  <rect
    x={-centerWhiteSquareSize/2} y={-centerWhiteSquareSize/2}
    height={centerWhiteSquareSize} width={centerWhiteSquareSize}
    style={{fill: lighter, stroke: lightest, strokeWidth: linearSizeOfFace/30}} />
  </g>)
}

const distanceBetweenFacesAsFractionOfLinearSizeOfFace = 1/4;
const ratioOfPortraitSheetWidthToFaceSize = 5 + 6 * distanceBetweenFacesAsFractionOfLinearSizeOfFace;
const ratioOfPortraitSheetHeightToWidth = 155 / 130; // sheets are manufactured 155mm x 130mm
const ratioOfPortraitSheetLengthToFaceSize = ratioOfPortraitSheetHeightToWidth * ratioOfPortraitSheetWidthToFaceSize;

class StickerTargetSheetSizeModel {
  constructor(public readonly linearSizeOfFace: number = 1) {}

  static toFit = ({width, height}: {width?: number, height?: number}) => 
    new StickerTargetSheetSizeModel(
      width != null && height != null ?
        Math.min(width / ratioOfPortraitSheetWidthToFaceSize, height / ratioOfPortraitSheetLengthToFaceSize) :
      height != null ? height :
      width != null ? width : ratioOfPortraitSheetLengthToFaceSize
    );

  width = this.linearSizeOfFace * ratioOfPortraitSheetWidthToFaceSize;
  height = this.linearSizeOfFace * ratioOfPortraitSheetLengthToFaceSize;
  distanceBetweenDieCenters = this.linearSizeOfFace * (1 + distanceBetweenFacesAsFractionOfLinearSizeOfFace);
  top = -this.height / 2;
  left = -this.width / 2;
  radius = 0;
}

interface StickerTargetSheetViewProps {
  diceKey: DiceKey;
  indexOfLastFacePlaced?: number;
  highlightThisFace?: number;
  sizeModel?: StickerTargetSheetSizeModel;
}

export const StickerTargetSheetSvgGroup = observer( (props: StickerTargetSheetViewProps & {sizeModel: StickerTargetSheetSizeModel}
  ) => {
    const {
      sizeModel = new StickerTargetSheetSizeModel(),
      diceKey,
      indexOfLastFacePlaced = -1,
      highlightThisFace
    } = props;
  
    return (
      <g>/* Sticker Sheet */
        <rect
          x={sizeModel.left} y={sizeModel.top}
          width={sizeModel.width} height={sizeModel.height}
          rx={sizeModel.radius} ry={sizeModel.radius}
          stroke={"gray"}
          fill={"white"}
          strokeWidth={0.0125}
        />
        {
          diceKey.faces.map( (face, index) => (index > indexOfLastFacePlaced) ? (
            <FaceTargetPlaceholderSvgGroup linearSizeOfFace={sizeModel.linearSizeOfFace}
              transform={`translate(${
                sizeModel.distanceBetweenDieCenters * (-2 + (index % 5)) }, ${
                sizeModel.distanceBetweenDieCenters * (-2 + Math.floor(index / 5))
              })`}
            />
          ) : (
            <FaceGroupView
              key={index}
              face={face}
              stroke={"rgba(128, 128, 128, 0.2)"}
              strokeWidth={sizeModel.linearSizeOfFace / 80}
              center={{
                  x: sizeModel.distanceBetweenDieCenters * (-2 + (index % 5)),
                  y: sizeModel.distanceBetweenDieCenters * (-2 + Math.floor(index / 5))}
                }
              highlightThisFace={highlightThisFace === index}
            />
          ))
        }
      </g>
    );
});

export const StickerTargetSheetView = observer( (props: StickerTargetSheetViewProps) => {
    const {sizeModel = new StickerTargetSheetSizeModel(), ...otherProps} = props;
    const viewBox = `${sizeModel.left} ${sizeModel.top} ${sizeModel.width} ${sizeModel.height}`
    return (
      <svg viewBox={viewBox}>
        <StickerTargetSheetSvgGroup {...otherProps} sizeModel={sizeModel} />
      </svg>
    )    
});


export const Preview_StickerTargetSheetView = () => (
  <StickerTargetSheetView diceKey={DiceKey.testExample} indexOfLastFacePlaced={12} />
)