import React from "react";
import { DiceKey } from "../../dicekeys/DiceKey";
import styled from "styled-components";

export const NicknameSpan = styled.span`
  font-family: serif;
`;

export const Nickname = ({nickname}: {nickname: string}) => (
  <NicknameSpan>{ nickname }</NicknameSpan>
);

export const DiceKeyNickname = ({diceKey}: {diceKey: DiceKey}) => (
  <Nickname nickname={diceKey.nickname} />
)