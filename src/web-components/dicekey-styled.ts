import SticKeysSvgFile from "../images/SticKeys.svg";
import DiceKeySvgFile from "../images/DiceKey.svg";
import DiceKeysSvgFile from "../images/DiceKeys.svg";

import {
  Img
} from "../web-component-framework";


export const STICKEYS = () => 
  Img({src: SticKeysSvgFile, style: `height: 0.95em; vertical-align: bottom;`});
export const DICEKEY = () => 
  Img({src: DiceKeySvgFile, style: `height: 0.95em; vertical-align: bottom;`});
export const DICEKEYS = () => 
  Img({src: DiceKeysSvgFile, style: `height: 0.95em; vertical-align: bottom;`});
