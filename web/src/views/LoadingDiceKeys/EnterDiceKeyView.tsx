import React from "react";
import { observer } from "mobx-react";
import { DiceKeyView } from "../SVG/DiceKeyView";
import { Instruction, CenterColumn, Instruction2 } from "../../views/basics";
import styled from "styled-components";
import { EnterDiceKeyState } from "./EnterDiceKeyState";

const KeyHints = styled(Instruction)`
  font-size: 1.25rem;
`;

/**
 * This class implements the component that allows manual entry of DiceKeys.
 */
export const EnterDiceKeyView = observer( class EnterDiceKeyView extends React.Component<React.PropsWithoutRef<{state: EnterDiceKeyState, instruction?: JSX.Element | string}>> {

  keyboardListener = (keyboardEvent: KeyboardEvent) => this.props.state.keyDownListener(keyboardEvent)

  componentDidMount() {
    document.addEventListener("keydown", this.keyboardListener);
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.keyboardListener);
  }

  render() {
    return (
      <>
        <CenterColumn>
          <Instruction>Type in your DiceKey one face at a time.</Instruction>
          { this.props.instruction == null ? null : (<Instruction2>{this.props.instruction}</Instruction2>) }
          <KeyHints>
            To rotate the current face, use either &lt; &gt;, - +, or CTRL arrow (right and left arrows).
          </KeyHints>
        </CenterColumn>
        <DiceKeyView
          $size="min(50vh,80vw)"
          obscureAllButCenterDie={false}
          faces={this.props.state.partialDiceKey}
          highlightFaceAtIndex={this.props.state.currentFaceIndex}
          onFaceClicked={ (index) => this.props.state.setCurrentFaceIndex(index)  }  
        />
      </>
    );
  }
});

// http://localhost:1234/?component=EnterDiceKeyView

export const Preview_EnterDiceKeyView = () => {
  const state = new EnterDiceKeyState();
  return (
    <EnterDiceKeyView state={state}/>
  )
}