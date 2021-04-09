import { urlSafeBase64Encode } from "@dicekeys/dicekeys-api-js";
import { getRandomBytes } from "../../dicekeys";

const authenticationFieldName = (authenticationToken: string) =>
  `authenticationToken:${authenticationToken}`;

  
export const addAuthenticationToken = (respondToUrl: string): string => {
  const authToken: string = urlSafeBase64Encode(getRandomBytes(20));
  localStorage.setItem(authenticationFieldName(authToken), respondToUrl);
  return authToken;
};

export const getUrlForAuthenticationToken = (
    authToken: string
  ) : string | undefined =>
    localStorage.getItem(authenticationFieldName(authToken)) ?? undefined;
