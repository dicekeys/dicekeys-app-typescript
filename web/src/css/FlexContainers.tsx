import styled from "styled-components";

const FlexColumn = styled.div`
  display: flex;
  flex-direction: column;
`;

const FlexColumnWide = styled(FlexColumn)`
  align-self: stretch;
`;

export const FlexColumnWideVerticallyStretched = styled(FlexColumnWide)`
  flex-grow: 5;
  flex-shrink: 5;
  justify-content: normal;
  align-content: space-around;
`
