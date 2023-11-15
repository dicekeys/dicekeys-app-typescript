import styled from "styled-components";

export const DivSupportingInvisible = styled.div<{$invisible?: boolean}>`
  visibility: ${props => props.$invisible ? "hidden" : "visible"}
`;
