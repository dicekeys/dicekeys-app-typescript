///////////////////////////////////////////////////////////////////////
// DiceKeys Face Dimensions Specification (NOT TO BE MODIFIED DIRECTLY!)
///////////////////////////////////////////////////////////////////////
//
// This TypeScript (.ts) file specifies the dimensions
// of fonts and data rendered onto DiceKeys faces.
//
// This file is generated automatically by the DiceKeys
// specification generator, which is written in TypeScript.
// That program also generates:
//    -- The SVG file that renders the appearance of each die face
//    -- The c++ (.h) version of this specification file
//
// To change the DiceKeys specification, you will need to change
// and re-run the specification program in TypeScript.
//
// To add additional definitions or help functions, create a new file
// that reads the constants you need from this file.
//

export const FaceDimensionsFractional = {
	"size": 1,
	"margin": 0,
	"linearSizeOfFace": 1,
	"linearSizeOfFacesPrintArea": 1,
	"center": 0.5,
	"fontSize": 0.741935,
	"undoverlineLength": 1,
	"undoverlineThickness": 0.177419,
	"overlineTop": 0,
	"overlineBottom": 0.177419,
	"underlineBottom": 1,
	"underlineTop": 0.822581,
	"undoverlineMarginAtLineStartAndEnd": 0.056452,
	"undoverlineMarginAlongLength": 0.048387,
	"undoverlineLeftEdge": 0,
	"undoverlineFirstDotLeftEdge": 0.056452,
	"undoverlineDotWidth": 0.080645,
	"undoverlineDotHeight": 0.080645,
	"centerOfUndoverlineToCenterOfFace": 0.41129,
	"underlineDotTop": 0.870968,
	"overlineDotTop": 0.048387,
	"textBaselineY": 0.725806,
	"charWidth": 0.370968,
	"charHeight": 0.488194,
	"spaceBetweenLetterAndDigit": 0.04375,
	"textRegionWidth": 0.785685,
	"textRegionHeight": 0.488194
} as const;

export const DotCentersAsFractionOfUndoverline: number[] = [
	0.0967745,
	0.1774195,
	0.2580645,
	0.3387095,
	0.41935449999999996,
	0.4999995,
	0.5806445,
	0.6612894999999999,
	0.7419344999999999,
	0.8225795,
	0.9032244999999999
];
