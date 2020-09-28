import {
  FaceDimensionsFractional,
  Point,
  FaceRead,
  Undoverline
} from "@dicekeys/read-dicekey-js";

const getFaceDimensions = (faceRead: FaceRead): {undoverlineLength: number, angleInRadians: number} | undefined => {
  const {
    underline,
    overline
  } = faceRead;
  /**
   * Determine the more reliable underline/overline to read
   */
  const undoverlineData = (
    // get the set of 0-2 undoverlines that are not null
    [underline, overline].filter( u => u != null ) as Undoverline[]
  ).map( ({line}) => ({
    lineLength: Math.sqrt( Math.pow(line.end.x - line.start.x, 2) + Math.pow(line.end.y - line.start.y, 2) ),
    angleInRadians: Math.atan2(line.end.y - line.start.y, line.end.x - line.start.x)
  }));
  if (undoverlineData.length == 0) {
    return undefined;
  }
  const undoverlineLength = undoverlineData.reduce( (r, {lineLength}) => r + lineLength, 0) / undoverlineData.length;
  const angleInRadians = (undoverlineData.length < 2 || 
    Math.abs(undoverlineData[0].angleInRadians - undoverlineData[1].angleInRadians) > Math.PI
  ) ? undoverlineData[0].angleInRadians :
    (undoverlineData[0].angleInRadians + undoverlineData[1].angleInRadians) / 2;
  return {undoverlineLength, angleInRadians};
}

const adjustPoint = (start: Point, offset: Point, angleInRadians: number): Point => ({
  x: start.x + offset.x * Math.cos(angleInRadians) - offset.y * Math.sin(angleInRadians),
  y: start.y + offset.x * Math.sin(angleInRadians) + offset.y * Math.cos(angleInRadians)
})

const drawRotatedRect = (ctx: CanvasRenderingContext2D, center: Point, xSize: number, ySize: number, angleInRadians: number) => {
  const halfXSize = xSize / 2;
  const halfYSize = ySize / 2;

  const points = ([
      [-1, -1], [-1, 1], [1, 1], [1, -1]
    ] as const
  ).map( ([xDir, yDir]) => adjustPoint(center, {x: halfXSize * xDir, y: halfYSize * yDir}, angleInRadians))
  .map( ({x, y}) => [x, y] as [number, number]);
  // Start at the last point
  ctx.moveTo(...points[3])
  ctx.beginPath();
  // Draw a line around the rectangle starting from  point 3
  // to point 0, then to 1, then 2, then back to 3.
  points.forEach( point => ctx.lineTo(...point));
}


export const renderFaceRead = (ctx: CanvasRenderingContext2D, faceRead: FaceRead) => {
  const faceDimensions = getFaceDimensions(faceRead);
  if (faceDimensions == null) {
    return;
  }
  const {undoverlineLength, angleInRadians} = faceDimensions;
  const {center, underline, overline} = faceRead;
  const faceSizeInPixels = undoverlineLength / FaceDimensionsFractional.undoverlineLength;
  const undoverlineThickness = faceSizeInPixels * FaceDimensionsFractional.undoverlineThickness
  const centerOfUndoverlineToCenterOfFace = FaceDimensionsFractional.centerOfUndoverlineToCenterOfFace * faceSizeInPixels;
  const thinLineThickness = 1 + Math.floor(undoverlineLength / 70);
  const thickLineThickness = 2 * thinLineThickness;

  const {errors} = faceRead;
  const hasErrors = errors != null && errors.length > 0;
  ctx.strokeStyle = `green`;
  ctx.lineWidth = thickLineThickness;

  // Draw a rectangle around the face if an error has been found
  if (hasErrors) {
    ctx.strokeStyle = `red`;
    drawRotatedRect(ctx, center, faceSizeInPixels, faceSizeInPixels, angleInRadians);
    ctx.stroke();
  }

  const underlineError = (errors && errors[0].type === "undoverline-bit-mismatch" && errors[0].location === "underline");
  const overlineError = (errors && errors[0].type === "undoverline-bit-mismatch" && errors[0].location === "overline");

  if (underline) {
    ctx.strokeStyle = underlineError ? `red` : `green`;
    const underlineCenter = adjustPoint(center, {x: 0, y: centerOfUndoverlineToCenterOfFace}, angleInRadians);
    drawRotatedRect(ctx, underlineCenter, undoverlineLength, undoverlineThickness, angleInRadians);
  }

  if (overline) {
    ctx.strokeStyle = overlineError ? `red` : `green`;
    const overlineCenter = adjustPoint(center, {x: 0, y: -centerOfUndoverlineToCenterOfFace}, angleInRadians);
    drawRotatedRect(ctx, overlineCenter, undoverlineLength, undoverlineThickness, angleInRadians);
  }

  ctx.font = `bold ${faceSizeInPixels * FaceDimensionsFractional.fontSize} Inconsolata,monospace`;
  ctx.strokeStyle = overlineError || underlineError ? `orange` : `green`;
  const distanceToBaseline = FaceDimensionsFractional.textBaselineY-FaceDimensionsFractional.center;
  if (faceRead.letter) {
    const letterLocation = adjustPoint(
      center,
      {
        x: -faceSizeInPixels * FaceDimensionsFractional.textRegionWidth/2,
        y: distanceToBaseline
      },
      angleInRadians
    );
    ctx.strokeText(faceRead.letter, letterLocation.x, letterLocation.y)
  }
  if (faceRead.digit) {
    const digitLocation = adjustPoint(
      center,
      {
        x: faceSizeInPixels * FaceDimensionsFractional.spaceBetweenLetterAndDigit/2,
        y: distanceToBaseline
      },
      angleInRadians
    );
    ctx.strokeText(faceRead.digit, digitLocation.x, digitLocation.y)
  }
}

export const renderFacesRead = (ctx: CanvasRenderingContext2D, facesRead: FaceRead[]) => facesRead.forEach( face => renderFaceRead(ctx, face));
