import React from "react";
import { observer } from "mobx-react";
import { DiceKey } from "../../dicekeys/DiceKey";
import { StickerTargetSheetSvgGroup } from "./StickerTargetSheetView";
import { StickerSheetSizeModel, StickerSheetSvgGroup } from "./StickerSheetView";
import { Bounds } from "../../utilities/bounding-rects";

const spaceBetweenSheetsAsFractionOfSheetWith = 0.4;
const sheetWithAsFractionOfTotalWidth = 1 / (2 + spaceBetweenSheetsAsFractionOfSheetWith);

type FaceCopyingViewProps = Bounds & {
  diceKey: DiceKey,
  indexOfLastFacePlaced?: number,
}; //  & React.SVGAttributes<SVGGElement>
const FaceCopyingViewGroup = observer ( (props: FaceCopyingViewProps) => {
  const {width, height, diceKey, indexOfLastFacePlaced} = props;
  const face = diceKey.faces[indexOfLastFacePlaced ?? -1];
  const sheetSizeModel = StickerSheetSizeModel.fromOptions({width: width/sheetWithAsFractionOfTotalWidth, height: height}); 

  return (
    <g>
      <StickerSheetSvgGroup sizeModel={sheetSizeModel} showLetter={face.letter} highlightFaceWithDigit={face.digit} />
      <StickerTargetSheetSvgGroup diceKey={diceKey} sizeModel={sheetSizeModel} indexOfLastFacePlaced={indexOfLastFacePlaced}
        transform={`translate(${sheetSizeModel.width * (1 + spaceBetweenSheetsAsFractionOfSheetWith)}, 0)`}
      />
    </g>
  );
});


export const FaceCopyingView = observer( (props: FaceCopyingViewProps) => {
  const sizeModel = StickerSheetSizeModel.fromOptions(props);
  const viewBox = `${sizeModel.left} ${sizeModel.top} ${sizeModel.width * 2.4 /* fixme */} ${sizeModel.height}`
  return (
    <svg viewBox={viewBox}>
      <FaceCopyingViewGroup {...{...props, sizeModel}} />
    </svg>
  )    
});


export const Preview_FaceCopyingView = () => (
<FaceCopyingView diceKey={DiceKey.testExample} height={500} width={500} indexOfLastFacePlaced={12} />
)