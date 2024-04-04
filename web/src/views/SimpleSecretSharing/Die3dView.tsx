import React from "react";
import { FaceDigit, FaceLetter } from "../../dicekeys/DiceKey";
import { FaceGroupView } from "../SVG/FaceView";
import { addPreview } from "../basics/Previews";
import styled from "styled-components";

// See https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/matrix3d

interface SizeAndUnits {
	$size: number;
	$units: 'px' | 'rem' | 'vw' | 'vh';
}

const Die3DContainer = styled.div<SizeAndUnits>`
  width: ${ p => `${0.93 * p.$size}${p.$units}`};
  height: ${ p => `${p.$size}${p.$units}`};
	display: block;
	text-align: center;
	/* transform:
		translateY(${ p => `${0.05 * p.$size}${p.$units}`})
		translateX(${ p => `${-.12 * p.$size}${p.$units}`}); */
`;

const Die3DSection = styled.section<SizeAndUnits>`
	display: block;
  width: ${ p => `${p.$size}${p.$units}`};
  height: ${ p => `${p.$size}${p.$units}`};
  transform-style: preserve-3d;
  transform:
		translateX(${ p => `${.205 * p.$size}${p.$units}`})
		translateY(${ p => `${-.10 * p.$size}${p.$units}`})
		rotate3d(1, 3, 1.5, 145deg)
		;
	/* margin: auto; */
  /* margin: calc(${ p => `${p.$size}${p.$units}`} * 0.25) auto; */
`

interface FaceRotationDegrees {
	$rotateX?: `${number}deg`,
	$rotateY?: `${number}deg`
}

const faceSizeAsFractionOfBoxSize = 0.59;

const DieFace3DSvg = styled.svg<SizeAndUnits & FaceRotationDegrees>`
  width: ${ p => `${faceSizeAsFractionOfBoxSize * p.$size}${p.$units}`};
  height: ${ p => `${faceSizeAsFractionOfBoxSize * p.$size}${p.$units}`};
  position: absolute;
  backface-visibility: inherit;
  transform: ${ ({$rotateX, $rotateY, $size, $units}) => `${
		$rotateX ? `rotateX(${$rotateX}) ` : `` }${
		$rotateY ? `rotateY(${$rotateY}) ` : ``
	} translateZ(${0.499 * faceSizeAsFractionOfBoxSize * $size}${$units});`}
`;



const FaceRotations = [
	['1', {} as FaceRotationDegrees],
	['2', {$rotateY: `180deg` as const} as FaceRotationDegrees],
	['3', {$rotateY: `90deg` as const}],
	['4', {$rotateY: `-90deg` as const}],
	['5', {$rotateX: `90deg` as const}],
	['6', {$rotateX: `-90deg` as const}],
] satisfies [FaceDigit, FaceRotationDegrees][];

export const Die3dView = ({
	letter,
	dieColor = "rgba(224, 224, 224, 1)",
	strokeColor,
	$size, $units
}: {
	letter: FaceLetter,
	strokeColor?: string,
	dieColor?: string | undefined
} & SizeAndUnits) => {
	return (
		<Die3DContainer {...{$size,$units}}>
			<Die3DSection {...{$size,$units}}>
				{FaceRotations.map(([digit, faceRotations]) => (
					<DieFace3DSvg key={digit} {...{$size,$units,...faceRotations}} viewBox="-.5, -.5, 1, 1">
						<FaceGroupView
							face={{letter, digit: `${digit}`, orientationAsLowercaseLetterTrbl: 't'}}
							linearSizeOfFace={1}
							backgroundColor={dieColor}
							strokeColor={strokeColor}
						/>
					</DieFace3DSvg>
				))}
		</Die3DSection>
	</Die3DContainer>
)};

const previewSize = 50;
const previewSizeUnits = 'vh' as const;

addPreview("Die3dSvg", () => ( 
	<div style={{alignSelf: "center", display: "block", backgroundColor: "green"}}>
	  <Die3dView letter={'A'} $size={previewSize} $units={previewSizeUnits} />
	</div>
));
