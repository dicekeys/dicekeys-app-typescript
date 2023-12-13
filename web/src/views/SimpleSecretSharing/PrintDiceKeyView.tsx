import { observer } from "mobx-react";
import React from "react";
import styled from "styled-components";
import { DiceKey, DiceKeyWithoutKeyId, FaceLetter } from "../../dicekeys/DiceKey";
import { DiceKeyView } from "../SVG/DiceKeyView";
import { addPreview } from "../basics/Previews";
import { AndClause, zeroThrough24En } from "../basics";
import { ObservableLocalStorageBoolean } from "../../utilities/ObservableLocalStorage";
import { PreferredPushButton, PushButton } from "../../css/Button";
import { ShareLetter } from "./layout";
import { BooleanState } from "../../state/reusable";
import { BackupStatus, BackupStatusCompletedWithoutValidation } from "../BackupView/BackupStatus";

export const PrintContainer = styled.div`
	/* position: fixed; */
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
	background-color: white;
	display: flex;
	flex-direction: column;
	align-items: center;
	@media screen {
		overflow-y: scroll;
		width: 100vw;
		height: 100vh;
	}
	@media print {
		height: fit-content;
		@page {margin: 0;}
	}
`;

const PrintedPage = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	flex-direction: column;
	@media print {
		break-after: page;
		padding-left: 10vw;
		padding-right: 10vw;
		height: 100vh;
		flex-grow: 1;
		background-color: green;
	}
`

export const TitleRegion = styled.div`
	display: block;
	font-size: 3rem;
	font-family: serif;
	margin-bottom: 1rem;
`;

export const DetailedTextRegion = styled.div`
	margin-top: 2rem;
	display: block;
	font-size: 1.25rem;
	font-family: sans-serif;
`

export const WarningContainer = styled.div`
	font-family: sans-serif;
	display: flex;
	width: 100%;
	height: 100%;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	font-size: 1.5rem;
	background-color: yellow;
	overflow: scroll;
`;

export const WarningContent = styled.div`
	margin-left: 5vw;
	margin-right: 5vw;
	padding: 1rem;
	border-radius: 1rem;
	background-color: ${p => p.theme.colors.background};
`

export const CheckboxLabel = styled.label`
	font-size: 1rem;
`

export const HidePrintWarningForever = new ObservableLocalStorageBoolean("HidePrintWarningForever", false)

const WarningOptions = styled.div`
	display: flex;
	flex-direction: row;
	justify-content: space-around;
	align-items: center;
`

const ButtonAndCheckboxCluster = styled.div`
	display: flex;
	flex-direction: row;
	align-items: center;
`;

export const PrintWarningView = observer( ({
	cancel, disregard
} : {
	cancel: () => void;
	disregard: () => void;
}) => {
	const [doNotShowAgain, setDoNotShowAgain] = React.useState(false);
	const onDisregardClicked = () => {
		if (doNotShowAgain) {
			HidePrintWarningForever.setTrue();
		}
		disregard();
	}
	return (
		<WarningContainer>
			<WarningContent>
				<h2>Think Twice Before Printing DiceKeys or Other Secrets</h2>
					<p>
						A DiceKey or other secret may be leaked (compromised) during printing if:
					</p>
					<ul>
						<li>the printer is compromised by a virus or other malware,</li>
						<li>the network you use to connect with your printer is compromised,</li>
						<li>the printer retains copies of the documents it prints in its memory (many do!),</li>
						<li>the printer is in a location where others can access it or see print-outs,</li>
						<li>the printer is in view of security cameras or other cameras,</li>
						<li>the printer jams and you are unable to retrieve the print-out before others do, or</li>
						<li>you unwittingly print to the wrong printer.</li>
					</ul>
					<p>Replicating a DiceKey using a DiceKey kit or SticKey kit is more expensive and time consuming,
						but it is averts the risks of printing.
					</p>
					<WarningOptions>
					<PreferredPushButton type="button" onClick={cancel}>Cancel printing</PreferredPushButton>
					<ButtonAndCheckboxCluster>
						<CheckboxLabel htmlFor="doNotShowPrintDiceKeysWarningAgain">
							Don't show this again
							<input id="doNotShowPrintDiceKeysWarningAgain" type="checkbox" checked={doNotShowAgain} onChange={e => setDoNotShowAgain(e.target.checked)} />
						</CheckboxLabel>
						<PushButton onClick={onDisregardClicked}>Print Anyway</PushButton>
					</ButtonAndCheckboxCluster>
					</WarningOptions>
			</WarningContent>
		</WarningContainer>
	);
});

export const ScreenOnlyRegion = styled.div`
	@media print {
		display: none;
	}
`;

export const disregardedPrintWarningViewThisSession = new BooleanState(false);

export const printWindowAsync = () => new Promise<Event>( (resolve) => {
	const afterPrint = (event: Event) => {
		window.removeEventListener("afterprint", afterPrint);
		resolve(event);
	};
	const startPrinting = () => {
		window.addEventListener("afterprint", afterPrint);
		window.print();
	}
	// Give 500ms for page to render before printing
	setTimeout(startPrinting, 500);
});
export const printWindow = (callbackOnCompleted: () => void) =>
	printWindowAsync().finally( callbackOnCompleted );

export const WarnBeforePrinting = observer( ({
	children,
	onUserCancel,
	onPrintComplete,
}: React.PropsWithChildren<{
	onUserCancel: () => void;
	onPrintComplete: () => void;
}>) => {
	if (HidePrintWarningForever.value === false && disregardedPrintWarningViewThisSession.value === false) {
		return (<PrintWarningView cancel={onUserCancel} disregard={() => disregardedPrintWarningViewThisSession.set(true)} />);
	} else {
		printWindow(onPrintComplete);
		return <PrintContainer>{children}</PrintContainer>;
	}
});

export const PrintDiceKeyContentView = observer( ({
	title,
	diceKey,
	children,
} : React.PropsWithChildren<{
	title?: string | JSX.Element;
	diceKey: DiceKey;
}>) => (
	<>
		{ title == null ? null : (<TitleRegion>{title}</TitleRegion>) }
			<DiceKeyView
				diceKey={diceKey}
				$size={`min(100vw, 60vh)`}
				obscureAllButCenterDie={false}
				diceBoxColor="black"
			/>
			{ children == null ? null : (<DetailedTextRegion>{children}</DetailedTextRegion>) }
	</>
));

export const PrintDiceKeyView = observer( ({
	title,
	diceKey,
	onComplete,
	children,
} : React.PropsWithChildren<{
	title?: string | JSX.Element;
	diceKey: DiceKey;
	onComplete: (status: BackupStatus) => void
}>) => (
	<WarnBeforePrinting onUserCancel={() => onComplete("cancelled")} onPrintComplete={() => onComplete(BackupStatusCompletedWithoutValidation)}>
		<PrintedPage>
			<PrintDiceKeyContentView title={title} diceKey={diceKey}>{children}</PrintDiceKeyContentView>
		</PrintedPage>
	</WarnBeforePrinting>
));

export const PushButtonContentsColumn = styled(PushButton)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

export const PrintWarningSymbol = observer( () => 
	( disregardedPrintWarningViewThisSession.value || HidePrintWarningForever.value ? '' : '⚠️' )
);

export const PrintButtonWithWarning = observer (({onClick, children}: React.PropsWithChildren<{onClick: () => void}>) => (
		<PushButtonContentsColumn style={{alignSelf: 'center'}} onClick={onClick}>
		<span style={{fontSize: '3rem'}}>🖨</span>
		{ children ?? 'Print'} <PrintWarningSymbol/>
	</PushButtonContentsColumn>
	)
);


const TitleContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
`;

const TitleShareNote = styled.div`
	display: block;
	font-size: 0.75rem;
	font-family: sans-serif;
	font-style: italic;
` 

const TitleShareName = styled.div`
	display: block;
	font-size: 2rem;
	font-family: sans-serif;
`

export const PrintDiceKeyShareContentView = observer( ({
	share,
	minSharesToDecode,
	otherShareLetters,
	toRecoverDiceKeyWithCenterLetter,
} : {
	share: DiceKey;
	otherShareLetters: FaceLetter[];
	minSharesToDecode: number;
	toRecoverDiceKeyWithCenterLetter: string;
}) => {
	return (
		<PrintDiceKeyContentView diceKey={share} 
			title={(<TitleContainer>
				<TitleShareName>Share&nbsp;<ShareLetter>{share.centerFace.letter}</ShareLetter></TitleShareName>
				<TitleShareNote>As identified by the letter {share.centerFace.letter} on the center die</TitleShareNote>
			</TitleContainer>)}
		>
		<p>
			Combine with {zeroThrough24En[minSharesToDecode-1]} other
			share{ minSharesToDecode > 2 ? 's' : ''
			}&nbsp;(from&nbsp;<AndClause items={otherShareLetters.map( letter => (<ShareLetter>{letter}</ShareLetter>))} />)
			to recover the DiceKey with center letter&nbsp;<ShareLetter>{toRecoverDiceKeyWithCenterLetter}</ShareLetter>.
		</p>
	</PrintDiceKeyContentView>
	);
});

export const PrintDiceKeyShareView = observer( ({
	share,
	minSharesToDecode,
	onComplete,
	otherShareLetters,
	toRecoverDiceKeyWithCenterLetter,
} : React.ComponentPropsWithoutRef<typeof PrintDiceKeyShareContentView> & {
	onComplete: (status: BackupStatus) => void;
}) => (
	<WarnBeforePrinting onUserCancel={() => onComplete("cancelled")} onPrintComplete={() => onComplete(BackupStatusCompletedWithoutValidation)}>
		<PrintedPage>
			<PrintDiceKeyShareContentView {...{share, minSharesToDecode, otherShareLetters, toRecoverDiceKeyWithCenterLetter}} />
		</PrintedPage>
	</WarnBeforePrinting>
));

export const PrintAllDiceKeySharesView = observer( ({
	shares,
	minSharesToDecode,
	onComplete,
	toRecoverDiceKeyWithCenterLetter,
} : {
	shares: DiceKey[];
	minSharesToDecode: number;
	toRecoverDiceKeyWithCenterLetter: string;
	onComplete: (status: BackupStatus) => void;
}) => (
	<WarnBeforePrinting onUserCancel={() => onComplete("cancelled")} onPrintComplete={() => onComplete(BackupStatusCompletedWithoutValidation)}>{
		shares.map( share => (
		<PrintedPage key={share.centerLetterAndDigit}>
			<PrintDiceKeyShareContentView {...{share, minSharesToDecode, toRecoverDiceKeyWithCenterLetter}} 
				otherShareLetters={ shares.map( s => s.centerFace.letter).filter( l => l != share.centerFace.letter) }
			/>
		</PrintedPage>
	))}
	</WarnBeforePrinting>
));


export class PropsWrapper<T> {
	constructor(public readonly props: T) { Object.assign(this, props); }
}

export class PrintDiceKeyShareViewPropsWrapper extends PropsWrapper<React.ComponentPropsWithRef<typeof PrintDiceKeyShareView>> {
	 constructor(props: React.ComponentPropsWithRef<typeof PrintDiceKeyShareView>) { super(props) }
}
export class PrintAllDiceKeySharesViewPropsWrapper extends PropsWrapper<React.ComponentPropsWithRef<typeof PrintAllDiceKeySharesView>> {
	constructor(props: React.ComponentPropsWithRef<typeof PrintAllDiceKeySharesView>) { super(props) }
}


addPreview("PrintDiceKeyShareView", () => ( 
  <PrintDiceKeyShareView
		toRecoverDiceKeyWithCenterLetter={"Z"}
		otherShareLetters={["B", "C", "D", "E"]}
		share={DiceKeyWithoutKeyId.testExample}
		minSharesToDecode={3}
		onComplete={() => {}}
	/>
));

addPreview("PrintWarning", () => ( 
  <PrintWarningView cancel={() => {}} disregard={() => {}} />
));