import styled from "styled-components";

export const FullScreenNotification = styled.div`
position: absolute;
box-sizing: border-box;
left: 0;
top: 0;
width: 100vw;
height: 100vh;
display: flex;
flex-direction: column;
justify-content: center;
align-items: center;
padding-left: 5vw;
padding-right: 5vw;
padding-top: 0.25vh;
padding-bottom: 0.25vh;
background-color: rgba(128,128,128,0.95);
font-size: 1.5rem
`

export const FullScreenNotificationContent = styled.div`
display: flex;
flex-direction: column;
font-size: 1.5rem;
background-color: white;
font-family: sans-serif;
width: 60vw;
border-radius: min(3vw, 3vh);
`

export const FullScreenNotificationItem = styled.div`
padding: min(3vw, 3vh);
`

export const FullScreenNotificationPrimaryText = styled(FullScreenNotificationItem)`
font-weight: bold;
`;

export const FullScreenNotificationSecondaryText = styled(FullScreenNotificationItem)``;
