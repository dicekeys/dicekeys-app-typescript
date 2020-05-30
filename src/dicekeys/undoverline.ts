import {
  decodeUnderlineTable, decodeOverlineTable
} from "./undoverline-tables";
import {
  FaceLetter, FaceDigit
} from "./face";


export interface Point {
	x: number;
	y: number;
}

export interface Line {
  readonly start: Point;
  readonly end: Point;
}

export interface UndoverlineJson {
  readonly line: Line;
  readonly code: number;
}

export const PointJsonKeys = ["x", "y"] as const;
const testPointJsonKeys: readonly (keyof Point)[] = PointJsonKeys;

export const LineJsonKeys = ["start", "end"] as const;
const testLineJsonKeys: readonly (keyof Line)[] = LineJsonKeys;

export const UndoverlineJsonKeys = ["line", "code"] as const;
const testUndoverlineJsonKeys: readonly (keyof UndoverlineJson)[] = UndoverlineJsonKeys;


export class Undoverline implements UndoverlineJson {
  constructor(
    public readonly lineType: "overline" | "underline",
    public readonly line: Line,
    public readonly code: number
  ) {}

      
  public static fromJsonObject = (
    lineType: "overline" | "underline",
    {line, code}: UndoverlineJson
  ) => new Undoverline(lineType, line, code);
  
  public static fromJsonUnderlineObject = (jsonObj: UndoverlineJson | undefined) =>
    jsonObj && Undoverline.fromJsonObject("underline", jsonObj);
  public static fromJsonOverlineObject = (jsonObj: UndoverlineJson | undefined) =>
    jsonObj && Undoverline.fromJsonObject("overline", jsonObj);

  public readonly faceWithUnoverlineCodes =
    this.lineType === "underline" ?
      decodeUnderlineTable[this.code] :
      decodeOverlineTable[this.code];

  public readonly letter: FaceLetter | undefined =
    this.faceWithUnoverlineCodes == null ? undefined : this.faceWithUnoverlineCodes.letter;

  public readonly digit: FaceDigit | undefined =
    this.faceWithUnoverlineCodes == null ? undefined : this.faceWithUnoverlineCodes.digit;
}
