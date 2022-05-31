import React from "react";
import {
  getKnownHost
} from "../../phrasing/api";

import styled from "styled-components";

const HostNameSpan = styled.span`
  font-family: monospace;
`;

const KnownApplicationNameSpan = styled.span`
  /* font-family: serif; */
  font-weight: 400;
  /* background-color: rgba(152, 160, 47, 0.1); */
  /* border-radius: 0.3rem; */
  /* text-decoration: rgba(152, 160, 47, 0.2) solid underline 0.2rem; */
`;


export const HostDescriptorView = ( {host}: {host: string}) => {
  const knownHost = getKnownHost(host);
  return (knownHost != null) ? (
    <KnownApplicationNameSpan>{ knownHost}</KnownApplicationNameSpan>
  ) : (
    <>the website at <HostNameSpan>{ host }</HostNameSpan></>
  )
}
