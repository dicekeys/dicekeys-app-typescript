import {
  Attributes,
  Component,
  ElementTagName
} from "../../web-component-framework";
import { 
  Observable,
} from "../../web-component-framework";


export interface ToggleButtonOptions<
  PRIMARY_ELEMENT_TAG_NAME extends ElementTagName = ElementTagName
> extends Attributes<PRIMARY_ELEMENT_TAG_NAME> {
  booleanObservable: Observable<boolean>
}

export class ToggleButton<
PRIMARY_ELEMENT_TAG_NAME extends ElementTagName,
OPTIONS extends ToggleButtonOptions<PRIMARY_ELEMENT_TAG_NAME> = ToggleButtonOptions<PRIMARY_ELEMENT_TAG_NAME>,
> extends Component<OPTIONS> {
  toggleUsePrescribedValue = () => {
    this.options.booleanObservable.set(!this.options.booleanObservable.value);
  }

  constructor(options: OPTIONS) {
    super(options);
    this.primaryElement.addEventListener("click", this.toggleUsePrescribedValue);
  }
}