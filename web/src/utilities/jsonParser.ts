const isWhiteSpaceCharCode = (charCode?: number) =>
(charCode === 0x20 || charCode === 0x0d || charCode === 0x0a || charCode === 0x09);
const isDigit = ( c: string ) => c >= '0' && c <= '9';

export interface ParsedJsonElementCommon {
  leadingWhiteSpace: string;
  indexOfStartAfterWhiteSpace: number;
  trailingWhiteSpace: string;
  asJsonString: string;
}

export interface ParsedJsonObjectField {
  indexOfLeadingComma: number | undefined;
  indexOfTrailingComma: number | undefined;
  indexOfNameValueSeparatingColon: number;
  name: ParsedJsonString;
  asJsonString: string;
  value: ParsedJsonElement;
}

export interface ParsedJsonArrayField {
  indexOfLeadingComma: number | undefined;
  indexOfTrailingComma: number | undefined;
  asJsonString: string;
  value: ParsedJsonElement;
}

export interface ParsedJsonObject extends ParsedJsonElementCommon {
  type: "object";
  indexOfOpeningBrace: number;
  indexOfClosingBrace: number;
  fields: ParsedJsonObjectField[];
  fieldsByName: {[key in string]: ParsedJsonObjectField};
}

export interface ParsedJsonArray extends ParsedJsonElementCommon {
  type: "array";
  indexOfOpeningBracket: number;
  indexOfClosingBracket: number;
  fields: ParsedJsonArrayField[];
}

export interface ParsedJsonBaseType<TYPENAME extends string, T> extends ParsedJsonElementCommon {
  type: TYPENAME
  value: T;
}
export type ParsedJsonNumber = ParsedJsonBaseType<"number", number>
export type ParsedJsonBoolean = ParsedJsonBaseType<"boolean", boolean>
export interface ParsedJsonString extends ParsedJsonBaseType<"string", string> {
  indexOfOpeningQuote: number;
  indexOfClosingQuote: number;
}
export interface ParsedJsonNull extends ParsedJsonBaseType<"null", null> {}

export interface ParsedJsonObject extends ParsedJsonElementCommon {
  type: "object";
  indexOfOpeningBrace: number;
  indexOfClosingBrace: number;
  fields: ParsedJsonObjectField[];
  fieldsByName: {[key: string]: ParsedJsonObjectField}
}

type ParsedJsonElement = (
  ParsedJsonObject |
  ParsedJsonArray |
  ParsedJsonBoolean |
  ParsedJsonNumber |
  ParsedJsonString |
  ParsedJsonNull
);

// https://www.json.org/json-en.html
class JsonAnnotationParser {
  /**
   * 
   * @param json A JSON string typically representing an array or object to modify while
   * preserving all formatting/ordering except when replacing/removing values/fields.
   * @param callback 
   * @param callback.key
   *  A function that takes as input the key and value
   * at a current position. If that key and/or value matches a value you would
   * like to replace, return a JSON-encoded replacement (e.g. `JSON.stringify(replacement)`),
   * otherwise, return undefined. Return a string containing the JSON-encoded replacement
   * Object keys are of form [""] and array keys [1].  So, for example, the third object
   * in an array with field "foo" would have key `[3]["foo"]`.
   * @returns The replaced JSON.  If you need to know which fields were replaced, track
   * that using the substitutionFunction state.
   */
  public static parseAnnotatedJson = (
    json: string
  ): ParsedJsonElement => {
    const parser = new JsonAnnotationParser(json);
    return parser.parse("");
  }

  constructor (
    private readonly sourceJson: string
  ) {}
  private indexIntoSourceJson: number = 0;

  private get c(): string {
    return this.sourceJson.charAt(this.indexIntoSourceJson);
  }
  private get charCode(): number {
    return this.sourceJson.charCodeAt(this.indexIntoSourceJson);
  }
  private isAt = (c: string) => this.c === c;
  private advanceIfAt = (c: string) => {
    const isAt = this.isAt(c);
    if (isAt) { this.advance() }
    return isAt;
  }
  private get atWhiteSpace() { return isWhiteSpaceCharCode(this.charCode); }
  private get atDigit() { return isDigit(this.c); }

  advance = (numberOfChars: number = 1) => {
    this.indexIntoSourceJson += numberOfChars;
  }

  private verifyCharAndAdvance = (charOrFn: string  | ((c: string) => boolean)) => {
    if (typeof charOrFn === "string") {
      if (this.c != charOrFn) {
        throw `Expected char ${charOrFn} but received ${this.c} at character ${this.indexIntoSourceJson}`
      }
    } else if (!charOrFn(this.c)) {
      throw `Failed to validate char, received ${this.c} at character ${this.indexIntoSourceJson}`
    }
    this.advance();
  }
  
  private skipWhiteSpace = (): string => {
    var whiteSpaceSkipped: string = "";
    while(this.atWhiteSpace) {
      whiteSpaceSkipped += this.c;
      this.advance();
    }
    return whiteSpaceSkipped;
  }

  private get atString() { return this.isAt('"') };

  private parseString = (): Omit<ParsedJsonString, keyof ParsedJsonElementCommon> => {
    const indexOfOpeningQuote = this.indexIntoSourceJson;
    this.verifyCharAndAdvance(`"`);
    while (this.c !== `"`) {
      // Advance two on a backslash which escapes the next character
      this.advance( this.c === '\\' ? 2 : 1);
      // WILL NOT correctly fail on \u that is not followed by 4 hex digits
      // if designed for security, fix this.
    }
    const indexOfClosingQuote = this.indexIntoSourceJson;
    this.verifyCharAndAdvance(`"`);
    const value: string = JSON.parse(this.sourceJson.substr(indexOfOpeningQuote, indexOfClosingQuote + 1 - (indexOfOpeningQuote))) as string;
    return {
      type: "string",
      indexOfOpeningQuote,
      indexOfClosingQuote,
      value
    }
  } 

  private get atNumber() { return this.atDigit || this.isAt('-') };

  private parseNumber = (): Omit<ParsedJsonNumber, keyof ParsedJsonElementCommon> => {
    const indexOfStart = this.indexIntoSourceJson;
    // optional minus sign (-)
    this.advanceIfAt('-');
    // whole number section
    if (this.isAt("0")) {
       // whole portion is just 0
      this.advance()
    } else {
      while(isDigit(this.c)) { this.advance(); }
    }
    // optional fraction
    if (this.advanceIfAt('.')) {
      // there is a fraction
      while (isDigit(this.c)) { this.advance(); }
    }
    // optional exponent
    if (this.c.toLocaleLowerCase() == "e") {
      this.advance();
      // there is an exponent
      if (this.c === "-" || this.c === "+") { this.advance(); }
      this.verifyCharAndAdvance(isDigit)
      while (this.atDigit) { this.advance() }
    }
    const indexOfEnd = this.indexIntoSourceJson
    const value = JSON.parse(this.sourceJson.substr(indexOfStart, indexOfEnd - indexOfStart)) as number;
    return {
      type: "number",
      value
    }
  }

  private get atBoolean() {
    const nextFiveChars = this.sourceJson.substr(this.indexIntoSourceJson, 5);
    return nextFiveChars === "false" || nextFiveChars.startsWith("true");
  }

  private parseBoolean = (): Omit<ParsedJsonBoolean, keyof ParsedJsonElementCommon> => {
    var value: boolean = false;
    if (this.sourceJson.substr(this.indexIntoSourceJson, 4) === "true") {
      value = true;
      this.advance(4);
    } else if (this.sourceJson.substr(this.indexIntoSourceJson, 5) === "false") {
      this.advance(5);
    } else {
      throw `Invalid boolean at ${this.indexIntoSourceJson}`;
    }
    return {type: "boolean", value};
  }

  private get atNull() { return this.sourceJson.substr(this.indexIntoSourceJson, 4) === "null" }
  
  private parseNull = (): Omit<ParsedJsonNull, keyof ParsedJsonElementCommon> => {
    if (!this.atNull) {
      throw `${this.indexIntoSourceJson}: parseNull called when not at null`;
    }
    this.advance(4);
    return {type: "null", value: null};
  }

  private get atArray() { return this.isAt('[') }
  
  private get atObject() { return this.isAt('{') }

  private get atValue() { 
    return this.atString || this.atNumber || this.atObject || this.atArray || this.atBoolean || this.atNull;
  }
  
  private parseArray = (): Omit<ParsedJsonArray, keyof ParsedJsonElementCommon> => {
    const fields = [] as ParsedJsonArrayField[];
    const indexOfOpeningBracket = this.indexIntoSourceJson;
    this.verifyCharAndAdvance('[');
    let whiteSpacePrecedingElement = this.skipWhiteSpace();
    var indexOfLeadingComma: number | undefined;
    if (this.atValue) {
      const indexOfFieldValueStart = this.indexIntoSourceJson;
      do {
        const value = this.parse(whiteSpacePrecedingElement);
        const indexOfFieldValueEnd = this.indexIntoSourceJson;
        const asJsonString = this.sourceJson.substr(indexOfFieldValueStart, indexOfFieldValueEnd - indexOfFieldValueStart);
        fields.push({
          indexOfLeadingComma, indexOfTrailingComma: undefined,
          asJsonString, value
        });
        if (!this.isAt(",")) {
          break;
        }
        // The trailing comma for the previous field is at this location
        fields[fields.length-1].indexOfTrailingComma = this.indexIntoSourceJson;
        // The leading comma for the next field is at this location
        indexOfLeadingComma = this.indexIntoSourceJson;
        this.advance();
        whiteSpacePrecedingElement = this.skipWhiteSpace();
      } while (true);
    }
    const indexOfClosingBracket = this.indexIntoSourceJson;
    this.verifyCharAndAdvance(']');
    return {
      type: "array",
      indexOfOpeningBracket, indexOfClosingBracket,
      fields
    };
  }

  private parseObject = (): Omit<ParsedJsonObject, keyof ParsedJsonElementCommon> => {
    const fields : ParsedJsonObjectField[] = []

    const indexOfOpeningBrace = this.indexIntoSourceJson;
    this.verifyCharAndAdvance('{');

    var indexOfLeadingComma: number | undefined;
    let whiteSpacePreceding = this.skipWhiteSpace();
    if (!this.isAt('}')) {
      while (true) {
        const fieldName = this.parse(whiteSpacePreceding);
        if (fieldName.type !== "string") {
          throw `Expected field name at character ${this.indexIntoSourceJson}`;
        }
        this.skipWhiteSpace();
        const indexOfNameValueSeparatingColon = this.indexIntoSourceJson;
        this.verifyCharAndAdvance(':')
        whiteSpacePreceding = this.skipWhiteSpace();
        const indexOfFieldValueStart = this.indexIntoSourceJson;
        const value = this.parse(whiteSpacePreceding);
        const indexOfFieldValueEnd = this.indexIntoSourceJson;
        const asJsonString = this.sourceJson.substr(indexOfFieldValueStart, indexOfFieldValueEnd - indexOfFieldValueStart)
        fields.push({
          indexOfLeadingComma,
          indexOfTrailingComma: undefined,
          indexOfNameValueSeparatingColon,
          name: fieldName,
          value,
          asJsonString
        });
        if (!this.isAt(",")) {
          break;
        }
        // The trailing comma for the previous field is at this location
        fields[fields.length-1].indexOfTrailingComma = this.indexIntoSourceJson;
        // The leading comma for the next field is at this location
        indexOfLeadingComma = this.indexIntoSourceJson;
        this.advance();
        whiteSpacePreceding = this.skipWhiteSpace()
      }
    }
    const indexOfClosingBrace = this.indexIntoSourceJson;
    this.verifyCharAndAdvance('}');

    const fieldsByName: {[key in string]: ParsedJsonObjectField} =
      fields.reduce( (fieldsByName, field) => {
          fieldsByName[field.name.value] = field;
          return fieldsByName;
        }, {} as {[key in string]: ParsedJsonObjectField}
      );
    return {
      type: "object",
      indexOfOpeningBrace, indexOfClosingBrace,
      fields, fieldsByName
    };
  }

  private parse = (leadingWhiteSpaceCharsAlreadySkipped: string): ParsedJsonElement => {
    const leadingWhiteSpace = leadingWhiteSpaceCharsAlreadySkipped + this.skipWhiteSpace();
    const indexOfStartAfterWhiteSpace = this.indexIntoSourceJson;
    var value: Omit<ParsedJsonElement, keyof ParsedJsonElementCommon>;
    if (this.atString) { value = this.parseString() }
    else if (this.atNumber) { value = this.parseNumber() }
    else if (this.atObject) { value = this.parseObject() }
    else if (this.atArray) { value = this.parseArray() }
    else if (this.atBoolean) { value = this.parseBoolean() }
    else if (this.atNull) { value = this.parseNull() }
    else {
      throw `value expected but none present`;
    }
    const length = this.indexIntoSourceJson - indexOfStartAfterWhiteSpace;
    const asJsonString = this.sourceJson.substr(indexOfStartAfterWhiteSpace, length);
    const trailingWhiteSpace = this.skipWhiteSpace();
    const commonFields: ParsedJsonElementCommon = {
      leadingWhiteSpace,
      indexOfStartAfterWhiteSpace,
      asJsonString,
      trailingWhiteSpace
    }
    return {
      ...value, ...commonFields
    } as ParsedJsonElement;
  }

}

export const parseAnnotatedJson = JsonAnnotationParser.parseAnnotatedJson;