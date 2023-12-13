import styled from "styled-components";

export const PreviewView = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: normal;
  align-items: stretch;
  height: 100vh;
  width: 96vw;
  padding-left: 2vw;
  padding-right: 2vw
`

export const Spacer = styled.div`
  flex-grow: 1;
  flex-shrink: 1;
`;

export const ResizableImage = styled.img`
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex-grow: 10;
  flex-shrink: 10;
  flex-basis: calc(min(25vw,25vh));
  min-height: 0;
  min-width: 0;
  margin: none;
  overflow: hidden
`;

export const CenterRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-content: center;
  align-self: center;
  justify-self: center;
`;

export const CenterColumn = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  align-self: center;
  justify-self: center;
`;

export const ContentBox  = styled.div`
  display: flex;
  flex-direction: column;
  align-content: stretch;
  overflow: hidden;
  flex-grow: 1;
  align-self: stretch;
  justify-content: space-around;
`;

export const CompressedContentBox  = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-content: stretch;
  overflow: hidden;
  flex-grow: 1;
  align-self: stretch;
`;

export const ContentRow  = styled.div`
  display: flex;
  align-self: stretch;
  flex-direction: column;
  align-content: stretch;
  overflow: hidden;
  justify-content: center;
  flex-direction: row;
  align-items: center;
  flex-grow: 1;
`;

export const ColumnCentered = styled.div`
  display: flex;
  align-self: center;
  justify-self: center;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
  align-content: center;
  flex-grow: 5;
  flex-shrink: 5;
`;

export const ColumnVerticallyCentered = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex-grow: 1;
`;

export const RowCentered = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

export const ColumnStretched = styled.div`
  display: flex;
  flex-direction: column;
  align-self: stretch;
  flex-grow: 5;
  flex-shrink: 5;
  justify-content: normal;
  align-content: space-around;
`;

export const PaddedContentBox = styled(ContentBox)`
  margin-left: 1.5rem;
  margin-right: 1.5rem;
  margin-bottom: 0.25rem;
  margin-top: 0.25rem;
`;