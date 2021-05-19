export interface Bounds {width: number; height: number;}

export const isBounds = (obj: any): obj is Bounds =>
  typeof obj === "object" && "width" in obj && "height" in obj &&
  typeof(obj.width) === "number" && typeof(obj.height) === "number";

/**
 * Given a ratio of width to height, return a function that takes a bounding box and
 * fits the largest possible rectangle with the required ratio into the bounding box.
 */
 export const fitRectangleWithAspectRatioIntoABoundingBox = (aspectRatioAsWidthOverHeight: number) => {
  const heightOverWidth = 1 / aspectRatioAsWidthOverHeight;  
  return (boxBounds: {width?: number, height?: number}) => {
    const width = (boxBounds.width != null && boxBounds.height != null) ?
        // fit to box
        Math.min(boxBounds.width, boxBounds.height * aspectRatioAsWidthOverHeight) :
      boxBounds.width != null ?
        // only width is specified, so just use it
        boxBounds.width :
      boxBounds.height != null ?
        // only height is specified, so calculate width from height
        boxBounds.height * aspectRatioAsWidthOverHeight :
        // neither height nor width is specified, so fit width into a 1x1 unit box
        Math.min(1, aspectRatioAsWidthOverHeight);
    const height = width * heightOverWidth;
    const centered = {
      left: ((boxBounds.width ?? width) - width) / 2,
      top: ((boxBounds.height ?? height) - height) / 2,
    }
    return {width, height, centered}
  }
}