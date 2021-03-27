import css from "./recipe-builder.module.css";
import React from "react";
import { action, makeAutoObservable } from "mobx";
import { observer  } from "mobx-react";
import { DerivationRecipeType } from "../../dicekeys/derivation-recipe";
import { CachedApiCalls } from "../../state/cached-api-calls";
import { SequenceNumberFormFieldView } from "./recipe-builder-sequence-number";
import { RecipeBuilderCommonState } from "./recipe-builder-common-state";

const getHostRestrictionsArrayAsString = (hosts: string[]): string =>
  `[${hosts
        .map( host => `{"host":"*.${host}"}` )
        .join(",")
    }]`;

const getRecipeJson = (
  {hosts, sequenceNumber = 1, lengthInChars = 0}: {
  hosts: string[],
  sequenceNumber?: number,
  lengthInChars?: number
}): string => `{${
    [
      (hosts.length == 0) ? "" : `{"allow":${getHostRestrictionsArrayAsString(hosts.sort())}}`,
      (lengthInChars <= 0) ? "" : `"lengthInChars":${lengthInChars}`,
      (sequenceNumber == 1) ? "" : `,"#":${sequenceNumber}`
    ].filter( s => s.length > 0)
    .join(",")
  }}`


export class RecipeBuilderCustomState implements RecipeBuilderCommonState {
  type: DerivationRecipeType;
  sequenceNumber?: number;
  lengthInChars?: number;
  hostsField: string = "";

  get hosts(): string[] {
    try {
      // If the host field contains a valid URL, return the host name
      return [new URL(this.hostsField).hostname];
    } catch {}
    // Return a list of valid domains
    return this.hostsField.split(",")
      .map( i => {
        const potentialHostName = i.trim();
        try {
          // Get JavaScript's URL parser to validate the hostname for us
          if (potentialHostName === new URL(`https://${potentialHostName}/`).hostname) {
            return potentialHostName;
          }
        } catch {}
        return undefined;
      })
      .filter( i =>  i ) as string[];
  }

  setSequenceNumber = action( (newSequenceNumber: number) => {
    this.sequenceNumber = newSequenceNumber;
  });

  get recipe(): string {
    return getRecipeJson(this);
  }

  get name(): string {
    return (this.hosts.length == 0 ? "[blank]" : this.hosts.join(", ")) + (
      (this.sequenceNumber ?? 1) == 1 ? `` : ` (${this.sequenceNumber})`
    )
  }

  constructor(defaultType: DerivationRecipeType = "Password") {
    this.type = defaultType;
    makeAutoObservable(this);
  }
}
