import React from "react";
import {
  ApiCalls
} from "@dicekeys/dicekeys-api-js";

import styled from "styled-components";
import { HostDescriptorView } from "./HostDescriptionView"

const RequestCommonDiv = styled.div`
  flex-shrink: 0;
  flex-grow: 0;
  font-family: sans-serif;
  text-align: center;
`;

const RequestChoice = styled(RequestCommonDiv)`
  font-size: 1.6666rem;
  color: #202000;
  font-weight: 400;
`;

const DICEKEY = "DiceKey";

export const RequestDescriptionView = ({command, host, isRecipeSigned = false}: {
  command: ApiCalls.Command,
  host: string,
  isRecipeSigned?: boolean
}) => {
  const createOrRecreate = isRecipeSigned ?
    "recreate" : "create";
  // use your DiceKey to 
  switch (command) {
    case "getPassword":
      return (<RequestChoice>May&nbsp;<HostDescriptorView host={host}/>&nbsp;use your { DICEKEY } to {createOrRecreate} a password?</RequestChoice>);
    case "getSecret":
      return (<RequestChoice>May&nbsp;<HostDescriptorView host={host}/>&nbsp;use your { DICEKEY } to {createOrRecreate} a secret code?</RequestChoice>);
    case "getUnsealingKey":
      return (<RequestChoice>May&nbsp;<HostDescriptorView host={host}/>&nbsp;use your { DICEKEY } to {createOrRecreate} keys to encode and decode secrets?</RequestChoice>);
    case "getSymmetricKey":
      return (<RequestChoice>May&nbsp;<HostDescriptorView host={host}/>&nbsp;use your { DICEKEY } to a {createOrRecreate} key to encode and decode secrets?</RequestChoice>);
    case "sealWithSymmetricKey":
      return (<RequestChoice>May&nbsp;<HostDescriptorView host={host}/>&nbsp;use your { DICEKEY } to encode a secret?</RequestChoice>);
    case "unsealWithSymmetricKey":
      return (<RequestChoice>May&nbsp;<HostDescriptorView host={host}/>&nbsp;use your { DICEKEY } to decode a secret?</RequestChoice>);
    case "unsealWithUnsealingKey":
      return (<RequestChoice>May&nbsp;<HostDescriptorView host={host}/>&nbsp;use your { DICEKEY } to decode a secret?</RequestChoice>);
    // Less common
    case "getSigningKey":
      return (<RequestChoice>May&nbsp;<HostDescriptorView host={host}/>&nbsp;use your { DICEKEY } to {createOrRecreate} keys to sign data?</RequestChoice>);
    case "generateSignature":
      return (<RequestChoice>May&nbsp;<HostDescriptorView host={host}/>&nbsp;use your { DICEKEY } to add its digital signature to data?</RequestChoice>);
    case "getSignatureVerificationKey":
      return (<RequestChoice>May&nbsp;<HostDescriptorView host={host}/>&nbsp;use your { DICEKEY } to {createOrRecreate} a key used to verify data it has signed?</RequestChoice>);
      // Uncommon
    case "getSealingKey": 
      return (<RequestChoice>May&nbsp;<HostDescriptorView host={host}/>&nbsp;use your { DICEKEY } to {createOrRecreate} keys to store secrets?</RequestChoice>);
    // Never
    // default:
    //     throw new Exceptions.InvalidCommand("Invalid API Command: " + command);
  }
};
