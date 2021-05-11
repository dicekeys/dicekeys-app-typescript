const isWhiteSpaceCharCode = (charCode?: number) =>
(charCode === 0x20 || charCode === 0x0d || charCode === 0x0a || charCode === 0x09);
const isDigit = ( c: string ) => c >= '0' && c <= '9';

// https://www.json.org/json-en.html
class JsonSubstitutionParser {
  private index: number = 0;
  private substitutionInProgress: boolean = false;
  substitutionsRemaining: Map<string, string>;

  public static replaceJsonFieldsInPlace = (
    sourceJson: string,
    substitutionsAsKeyValuePairs: [string, string][],
  ): string[] => {
    const parser = new JsonSubstitutionParser(sourceJson, substitutionsAsKeyValuePairs);
    parser.parse();
    const keysNotReplaced = substitutionsAsKeyValuePairs
      .map( ([key,_]) => key )
      .filter( key => parser.substitutionsRemaining.has(key) )
    return [ parser.destString, ...keysNotReplaced];
  }

  constructor (
    private readonly sourceJson: string,
    substitutionsAsKeyValuePairs: [string, string][],
  ) {
    this.substitutionsRemaining = new Map(substitutionsAsKeyValuePairs);
  }
  private destString: string = "";

  private get c(): string {
    return this.sourceJson.charAt(this.index);
  }
  private get charCode(): number {
    return this.sourceJson.charCodeAt(this.index);
  }
  private isAt = (c: string) => this.c === c;
  private advanceIfAt = (c: string) => {
    const isAt = this.isAt(c);
    if (isAt) { this.advance() }
    return isAt;
  }
  private get atWhiteSpace() { return isWhiteSpaceCharCode(this.charCode); }
  private get atDigit() { return isDigit(this.c); }
  private get atComma() { return this.isAt(',')}

  advance = (numberOfChars: number = 1, replaceWith: string = this.sourceJson.substr(this.index, numberOfChars)) => {
    if (!this.substitutionInProgress) {
      this.destString += replaceWith;
    }
    this.index += numberOfChars;
  }

  private verifyCharAndAdvance = (charOrFn: string  | ((c: string) => boolean), key: string) => {
    if (typeof charOrFn === "string") {
      if (this.c != charOrFn) {
        throw `Expected char ${charOrFn} but received ${this.c} at character ${this.index} in ${key} `
      }
    } else if (!charOrFn(this.c)) {
      throw `Failed to validate char, received ${this.c}  at character ${this.index} in ${key}`
    }
    this.advance();
  }
  
  private skipWhiteSpace = () => {
    while(this.atWhiteSpace) { this.advance() }
  }

  private get atString() { return this.isAt('"') };

  private parseString = (key: string): string => {
    const start = this.index;
    this.verifyCharAndAdvance(`"`, key);
    while (this.c !== `"`) {
      // Advance two on a backslash which escapes the next character
      this.advance( this.c === '\\' ? 2 : 1);
      // WILL NOT correctly fail on \u that is not followed by 4 hex digits
      // if designed for security, fix this.
    }
    this.verifyCharAndAdvance(`"`, key);
    const end = this.index;
    return JSON.parse(this.sourceJson.substr(start, end - start));
  } 

  private get atNumber() { return this.atDigit || this.isAt('-') };

  private parseNumber = (key: string): number => {
    const start = this.index;
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
      this.verifyCharAndAdvance(isDigit, key)
      while (this.atDigit) { this.advance() }
    }
    return JSON.parse(this.sourceJson.substr(start, this.index - start)) as number;
  }

  private get atBoolean() {
    const nextFiveChars = this.sourceJson.substr(this.index, 5);
    return nextFiveChars === "false" || nextFiveChars.startsWith("true");
  }

  private parseBoolean = (key: string): boolean => {
    var value: boolean = false;
    if (this.sourceJson.substr(this.index, 4) === "true") {
      value = true;
      this.advance(4);
    } else if (this.sourceJson.substr(this.index, 5) === "false") {
      this.advance(5);
    } else {
      throw `Invalid boolean at ${key}`;
    }
    return value;
  }

  private get atNull() { return this.sourceJson.substr(this.index, 4) === "null" }
  private parseNull = (key: string): null => {
    if (!this.atNull) {
      throw `${key}: parseNull called when not at null`;
    }
    this.advance(4);
    return null;
  }

  private get atArray() { return this.isAt('[') }
  
  private get atObject() { return this.isAt('{') }

  private get atValue() { 
    return this.atString || this.atNumber || this.atObject || this.atArray || this.atBoolean || this.atNull;
  }
  
  private parseArray = (key: string): any[] => {
    const result = [] as any[];
    this.verifyCharAndAdvance('[', key);
    this.skipWhiteSpace();
    var index: number = 0;
    if (this.atValue) {
      result.push(this.parseValue(`${key}[${index++}]`));
      while (this.atComma) {
        // step past the comma
        this.advance();
        result.push(this.parseValue(`${key}[${index++}]`));
      }
    }
    this.verifyCharAndAdvance(']', key);
    return result;
  }

  private parseObject = (key: string): Object => {
    let obj = {} as Record<any, any>
    const parseObjectEntry = (key: string) => {
      this.skipWhiteSpace();
      const fieldName = this.parseString(key);
      this.skipWhiteSpace();
      this.verifyCharAndAdvance(':', key)
      this.skipWhiteSpace();
      const value = this.parseValue(`${JSON.stringify(key)}[${fieldName}]`);
      obj[fieldName] = value;
    }
    this.verifyCharAndAdvance('{', key);
    this.skipWhiteSpace()
    if (!this.isAt('}')) {
      parseObjectEntry(key);
      while (this.advanceIfAt(',')) {
        parseObjectEntry(key);
      }
    }
    this.verifyCharAndAdvance('}', key);
    return obj;
  }

  private parseValue = (key: string): any => {
    var substitutingThisValue = (!this.substitutionInProgress && this.substitutionsRemaining.has(key));
    if (substitutingThisValue) {
      this.substitutionInProgress = true;
      this.destString += this.substitutionsRemaining.get(key);
      this.substitutionsRemaining.delete(key);
    }
    this.skipWhiteSpace();
    var result: any;
    if (this.atString) { result = this.parseString(key) }
    else if (this.atNumber) { result = this.parseNumber(key) }
    else if (this.atObject) { result = this.parseObject(key) }
    else if (this.atArray) { result = this.parseArray(key) }
    else if (this.atBoolean) { result = this.parseBoolean(key) }
    else if (this.atNull) { result = this.parseNull(key) }
    else {
      throw `value expected but none present`;
    }
    this.skipWhiteSpace();
    if (substitutingThisValue) {
      this.substitutionInProgress = false;
    }
    return result;
  }

  parse = () => this.parseValue("")
}

  /**
   * 
   * @param sourceJson The JSON to modify in place
   * @param substitutionsAsKeyValuePairs Pairs of key/value strings, where
   * values intended to represent strings must include quotes
   *    e.g. [ [ `["id-number"]`, `3` ], [ `["occupation"]`, `"pedant"`] ]
   * @returns An array of strings, the first of which is the modified json string
   * with the requested substitutions, and the remaining items are the keys
   * of substitutions that weren't made because they keys weren't found,
   * in the order provided in substitutionsAsKeyValuePairs.
   */
export const replaceJsonFieldsInPlace = JsonSubstitutionParser.replaceJsonFieldsInPlace;