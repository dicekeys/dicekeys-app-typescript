import style from "./expandable-component.module.css";
import {
  Component, Attributes, Observable, OptionallyObservable, Button, Appendable
} from "../../web-component-framework";


export interface ExpandableComponentOptions extends Attributes<"div"> {
  expanded?: OptionallyObservable<boolean>;
}
const expandMeIcon = "&#x25B6;"; // right arrow
const contractMeIcon = "&#x25BC;" // down arrow
export class ExpandableComponent extends Component<ExpandableComponentOptions> {

  expanded: Observable<boolean>;
  private componentToShowWhenExpanded?: Component;
  private readonly introductoryContentToShowAboveExpander: Appendable[];

  constructor(
    options: ExpandableComponentOptions,
    private renderComponentToShowWhenExpanded: () => Component,
    ...introductoryContentToShowAboveExpander: Appendable[]
  ) {
    super({class: style.expandable_component, ...options});
    this.introductoryContentToShowAboveExpander = introductoryContentToShowAboveExpander;
    this.expanded = Observable.from( options.expanded ?? false )
      .observe( this.onExpandedUpdated );
  }

  onExpandedUpdated = (expanded?: boolean) => {
    if (this.componentToShowWhenExpanded == null) {
      if (expanded) {
        this.componentToShowWhenExpanded = this.renderComponentToShowWhenExpanded();
        this.append(this.componentToShowWhenExpanded);
      }
    } else {
      this.componentToShowWhenExpanded.primaryElement.style.setProperty("display", !!expanded ? "flex" : "none");
    }
  }

  render() {
    super.render(
      ...this.introductoryContentToShowAboveExpander,
      Button({
        class: style.button,
        events: events => events.click.on( () => this.expanded.set( !this.expanded.value ) ),
      },"").withElement( e => this.expanded.observe( expanded => e.innerHTML = expanded ? contractMeIcon : expandMeIcon  ) ),
      ...( this.componentToShowWhenExpanded ? [this.componentToShowWhenExpanded] : [])
    )
  }

}