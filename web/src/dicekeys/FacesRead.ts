import { FaceRead, FaceReadError, FaceReadJson} from "@dicekeys/read-dicekey-js";
// import { action, makeAutoObservable } from "mobx";
// import { TupleOf25Items } from "./dicekey";
import { NumberOfFacesInKey } from "./DiceKey";

export type FaceReadJsonObjectWithImageIfErrorFound = FaceReadJson & {squareImageAsRgbaArray?: Uint8ClampedArray};
export type FaceReadWithImageIfErrorFound = FaceRead & {squareImageAsRgbaArray?: Uint8ClampedArray};

export const allFacesReadHaveMajorityValues = (facesRead?: FaceRead[]): boolean =>
  facesRead?.filter( faceRead =>
    faceRead.letter != null && faceRead.digit != null
  )?.length === NumberOfFacesInKey;

  
 /**
  * A list of all the error types impacting the set of die faces
  * (effectively a set presented as a list)
  */
export const allDiceErrorTypes = (facesRead?: FaceRead[]): FaceReadError["type"][] => {
  const faceReadErrorTypes = new Set<FaceReadError["type"]>();
  for (const face of facesRead ?? []) {
    for (const errorType of face.errors) {
       faceReadErrorTypes.add(errorType.type);
    }
  }
  return [...faceReadErrorTypes];
}

// type UserValidationOutcome = "user-confirmed" | "user-re-entered" | "user-rejected";

// export class FacesReadState {

//   /**
//    * The faces read during the process of scanning the dice, which includes details of overlines
//    * and underlines so that we can correct potential errors.
//    */
//   constructor(
//    private facesRead?: TupleOf25Items<FaceReadWithImageIfErrorFound>
//   ) {
//     makeAutoObservable(this);
//   }
//   private userValidationOutcomes = new Map<number, UserValidationOutcome>()

//   setUserValidationOutcome = action ( (index: number, outcome: UserValidationOutcome) => {
//     this.userValidationOutcomes.set(index, outcome);
//   });


//   get facesReadThatUserReportedInvalid(): FaceRead[] {
//     return this.facesRead?.filter( (_face, index) => this.userValidationOutcomes.get(index) === "user-rejected") ?? []
//   }

//   get userHasInvalidatedAFace(): boolean {
//     return this.facesReadThatUserReportedInvalid.length > 0;
//   }

//   /**
//   * The set of faces read that contain errors that the user has yet
//   * to verify were properly corrected
//   */
//   get facesReadThatContainErrorsAndHaveNotBeenValidated(): FaceReadWithImageIfErrorFound[] {
//     return this.facesRead?.filter( (f, index) => f.errors && f.errors.length > 0 &&
//     this.userValidationOutcomes.get(index) !== "user-confirmed" || f.userValidationOutcome === "user-re-entered" ) ?? []
//   }

//   /**
//   * Determines if all faces have either been read without errors or if all
//   * all corrected errors have been validated by the user so as to allow
//   * us to conclude that the DiceKey has been read correctly..
//   */
//   get allFacesHaveBeenValidated(): boolean {
//     return this.facesRead != null &&
//       this.facesRead.length === 25 &&
//       !this.userHasInvalidatedAFace &&
//       this.facesReadThatContainErrorsAndHaveNotBeenValidated.length == 0;    
//   }
// }
