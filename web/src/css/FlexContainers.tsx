// .HeaderFooterContentBox, .PaddedContentBox, .ContentBox, .ContentRow {
//   display: flex;
//   flex-direction: column;
//   justify-content: space-between;
//   align-content: stretch;
//   overflow: hide;
//   flex-grow: 1;
//   align-self: stretch;
// }

import styled from "styled-components";

// .VerticallyCentered {
//   display: flex;
//   flex-direction: column;
//   justify-content: center;
//   flex-grow: 1;
// }

// .ContentBox {
//   justify-content: space-around;
// }

// .ContentRow {
//   display: flex;
//   justify-content: center;
//   flex-direction: row;
//   align-items: center;
//   flex-grow: 1;
// }

// .PaddedContentBox {
//   margin-left: 1.5rem;
//   margin-right: 1.5rem;
//   margin-bottom: 0.25rem;
//   margin-top: 0.25rem;
// }

// .MarginsAroundForm {
//   margin: 2rem;
// }

// .LeftJustifiedColumn {
//   display: flex;
//   flex-direction: column;
//   justify-content: flex-start;
//   align-items: flex-start;
//   width: fit-content;
// }

// .RowStretched {
//   display: flex;
//   flex-direction: row;
// }

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

// .RowCentered {
//   display: flex;
//   flex-direction: row;
//   justify-content: center;
//   align-items: center;
// }

// .ColumnCentered {
//   justify-content: space-evenly;
//   align-items: center;
//   align-content: center;
//   flex-grow: 5;
//   flex-shrink: 5;
// }

// .RowStretched, .ColumnStretched, .PaddedStretchedColumn{
//   flex-grow: 5;
//   flex-shrink: 5;
//   /* flex-basis: 100%; */
//   justify-content: normal;
//   align-content: space-around;
// }

// .PaddedStretchedColumn {
//   margin: 1.5rem;
// }

// .Spacer {
//   flex-grow: 1;
//   flex-shrink: 1;
// }

// .Center {
//   display: flex;
//   flex-direction: row;
//   justify-content:center;
// }

// /**
//  CSS-FIXME -- these won't scale below the original image size
// */
// .ResizableImage {
//   display: flex;
//   flex-direction: column;
//   justify-content: center;
//   flex-grow: 10;
//   flex-shrink: 10;
//   flex-basis: calc(min(25vw,25vh));
//   min-height: 0;
//   min-width: 0;
//   margin: none;
//   overflow: hidden
// }

// .ResizableImage img {
//   display: flex;
//   flex-grow: 10;
//   flex-shrink: 10;
//   margin: 0px;  
//   object-fit: contain;
//   display: block;
//   min-width: 0px;
//   min-height: 0px;
// }

// /* FIXME -- deprecate these */

// .CenteredColumn, .stretched_column_container {
//   display: flex;
//   flex-direction: column;
// }

// .CenteredColumn {
//   justify-content: space-evenly;
//   align-items: center;
//   align-content: center;
//   flex-shrink: 5;
//   /* flex-grow: 5; */
//   flex-grow: 5;
//   flex-shrink: 5;
// }

// .stretched_column_container {
//   flex-grow: 5;
//   flex-shrink: 5;
//   flex-basis: 100vh;
//   justify-content: normal;
//   align-items: stretch;
//   align-self: stretch;
//   justify-self: stretch;
//   width: 100%;
//   height: 100%;
// }
