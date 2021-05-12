const isWhiteSpaceCharCode = (charCode?: number) =>
(charCode === 0x20 || charCode === 0x0d || charCode === 0x0a || charCode === 0x09);
const isDigit = ( c: string ) => c >= '0' && c <= '9';

export const DeleteThisField = Symbol();
//type DeleteThisField = typeof DeleteThisField;

export interface ModifyJsonCallbackParameters {
  key: string;
  value: any;
  replaceValueWithNewJsonEncodedValue: (newValue: string) => void;
  replaceValueWithNewValue: (newValue: any) => void;
  remove: () => void;
}

// https://www.json.org/json-en.html
class JsonModificationParser {
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
  public static modifyJson = (
    json: string,
    callback: (params: ModifyJsonCallbackParameters) => void,
  ): string => {
    const parser = new JsonModificationParser(json, callback);
    parser.parse();
    return parser.destString;
  }

  constructor (
    private readonly sourceJson: string,
    private readonly callback: (params: ModifyJsonCallbackParameters) => void,
  ) {}
  private indexIntoSourceJson: number = 0;
  private destString: string = "";

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
    this.destString += this.sourceJson.substr(this.indexIntoSourceJson, numberOfChars);
    this.indexIntoSourceJson += numberOfChars;
  }

  private verifyCharAndAdvance = (charOrFn: string  | ((c: string) => boolean), key: string) => {
    if (typeof charOrFn === "string") {
      if (this.c != charOrFn) {
        throw `Expected char ${charOrFn} but received ${this.c} at character ${this.indexIntoSourceJson} in ${key} `
      }
    } else if (!charOrFn(this.c)) {
      throw `Failed to validate char, received ${this.c}  at character ${this.indexIntoSourceJson} in ${key}`
    }
    this.advance();
  }
  
  private skipWhiteSpace = () => {
    while(this.atWhiteSpace) { this.advance() }
  }

  private get atString() { return this.isAt('"') };

  private parseString = (key: string): string => {
    const start = this.indexIntoSourceJson;
    this.verifyCharAndAdvance(`"`, key);
    while (this.c !== `"`) {
      // Advance two on a backslash which escapes the next character
      this.advance( this.c === '\\' ? 2 : 1);
      // WILL NOT correctly fail on \u that is not followed by 4 hex digits
      // if designed for security, fix this.
    }
    this.verifyCharAndAdvance(`"`, key);
    const end = this.indexIntoSourceJson;
    return JSON.parse(this.sourceJson.substr(start, end - start));
  } 

  private get atNumber() { return this.atDigit || this.isAt('-') };

  private parseNumber = (key: string): number => {
    const start = this.indexIntoSourceJson;
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
    return JSON.parse(this.sourceJson.substr(start, this.indexIntoSourceJson - start)) as number;
  }

  private get atBoolean() {
    const nextFiveChars = this.sourceJson.substr(this.indexIntoSourceJson, 5);
    return nextFiveChars === "false" || nextFiveChars.startsWith("true");
  }

  private parseBoolean = (key: string): boolean => {
    var value: boolean = false;
    if (this.sourceJson.substr(this.indexIntoSourceJson, 4) === "true") {
      value = true;
      this.advance(4);
    } else if (this.sourceJson.substr(this.indexIntoSourceJson, 5) === "false") {
      this.advance(5);
    } else {
      throw `Invalid boolean at ${key}`;
    }
    return value;
  }

  private get atNull() { return this.sourceJson.substr(this.indexIntoSourceJson, 4) === "null" }
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

    const indexIntoDestStringOfStartOfThisArray = this.destString.length;
    var indexIntoDestStringOfCommaPriorToThisItem: number | undefined;
    var awaitingRemovalOfFirstItem: boolean = false;
    const remove = () => {
      if (indexIntoDestStringOfCommaPriorToThisItem != null) {
        this.destString = this.destString.substr(0, indexIntoDestStringOfCommaPriorToThisItem)
      } else {
        awaitingRemovalOfFirstItem = true;
      }
    }

    this.skipWhiteSpace();
    var index: number = 0;
    if (this.atValue) {
      result.push(this.parseValue(`${key}[${index++}]`, remove));
      while (this.advanceIfAt(',')) {
        if (awaitingRemovalOfFirstItem) {
          this.destString = this.destString.substr(0, indexIntoDestStringOfStartOfThisArray);
          awaitingRemovalOfFirstItem = false;
        } else {
          indexIntoDestStringOfCommaPriorToThisItem = this.destString.length - 1;
        }        
        result.push(this.parseValue(`${key}[${index++}]`, remove));
      }
    }
    if (awaitingRemovalOfFirstItem) {
      this.destString = this.destString.substr(0, indexIntoDestStringOfStartOfThisArray);
    }
    this.verifyCharAndAdvance(']', key);
    return result;
  }

  private parseObject = (key: string): Object => {
    // FIXME ... on remove,
    // first item must remove until comma after
    // last item must remove start comma before
    // other items ??? 
    let obj = {} as Record<any, any>
    this.verifyCharAndAdvance('{', key);

    const indexIntoDestStringOfStartOfThisObject = this.destString.length;
    var indexIntoDestStringOfCommaPriorToThisItem: number | undefined;
    var awaitingRemovalOfFirstItem: boolean = false;
    const remove = () => {
      if (indexIntoDestStringOfCommaPriorToThisItem != null) {
        this.destString = this.destString.substr(0, indexIntoDestStringOfCommaPriorToThisItem)
      } else {
        awaitingRemovalOfFirstItem = true;
      }
    }
    const parseObjectEntry = (key: string) => {
      this.skipWhiteSpace();
      const fieldName = this.parseString(key);
      this.skipWhiteSpace();
      this.verifyCharAndAdvance(':', key)
      this.skipWhiteSpace();
      const value = this.parseValue(`${key}["${fieldName}"]`, remove);
      obj[fieldName] = value;
    }
    this.skipWhiteSpace()
    if (!this.isAt('}')) {
      parseObjectEntry(key);
      while (this.advanceIfAt(',')) {
        if (awaitingRemovalOfFirstItem) {
          this.destString = this.destString.substr(0, indexIntoDestStringOfStartOfThisObject);
          awaitingRemovalOfFirstItem = false;
        } else {
          indexIntoDestStringOfCommaPriorToThisItem = this.destString.length - 1;
        }
        parseObjectEntry(key);
      }
    }
    if (awaitingRemovalOfFirstItem) {
        this.destString = this.destString.substr(0, indexIntoDestStringOfStartOfThisObject);
    }
    this.verifyCharAndAdvance('}', key);
    return obj;
  }

  private parseValue = (key: string, remove: ()=>void ): any => {
    this.skipWhiteSpace();
    const start = this.indexIntoSourceJson;
    var value: any;
    if (this.atString) { value = this.parseString(key) }
    else if (this.atNumber) { value = this.parseNumber(key) }
    else if (this.atObject) { value = this.parseObject(key) }
    else if (this.atArray) { value = this.parseArray(key) }
    else if (this.atBoolean) { value = this.parseBoolean(key) }
    else if (this.atNull) { value = this.parseNull(key) }
    else {
      throw `value expected but none present`;
    }
    const replaceValueWithNewJsonEncodedValue = (newJsonEncodedValue: string): void => {
      this.destString = this.destString.substr(0, this.destString.length - (this.indexIntoSourceJson - start)).concat(newJsonEncodedValue); 
    }
    const replaceValueWithNewValue = (newValue: any): void => replaceValueWithNewJsonEncodedValue(JSON.stringify(newValue));
    this.callback({key, value, replaceValueWithNewJsonEncodedValue, replaceValueWithNewValue, remove});
    this.skipWhiteSpace();
    return value;
  }

  parse = () => {
    var returnEmptyString: boolean = false;
    const remove = () => { returnEmptyString = true; }
    const result = this.parseValue("", remove);
    return returnEmptyString ? "" : result;
  }
}

export const modifyJson = JsonModificationParser.modifyJson;