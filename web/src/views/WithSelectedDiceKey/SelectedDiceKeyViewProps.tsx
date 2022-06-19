import { SelectedDiceKeyViewState } from "./SelectedDiceKeyViewState";

export interface SelectedDiceKeyViewProps {
  state: SelectedDiceKeyViewState;
  goBack?: () => void;
}
