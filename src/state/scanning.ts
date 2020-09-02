import {
  FaceRead
} from "@dicekeys/read-dicekey-js"
import {
  Observable
} from "../web-component-framework";
import {
  TupleOf25Items
} from "../dicekeys/dicekey"

export var FacesRead = new  Observable<TupleOf25Items<FaceRead>>();
export const DieErrorImageMap = new Map<string, ImageData>()
