import { observer } from "mobx-react";
import React from "react";
import styled from "styled-components";
import { DiceKeyWithoutKeyId, FaceLetter, FaceLetters } from "../../dicekeys/DiceKey";
import { NavigationPathState } from "../../state/core/NavigationPathState";
import { rangeFromTo } from "../../utilities/range";
import { LoadDiceKeyContentPaneView } from "../LoadingDiceKeys/LoadDiceKeyView";
import { DiceKeyView } from "../SVG/DiceKeyView";
import { addPreview } from "../basics/Previews";
import { SimpleSecretSharingState, SimpleSecretSharingSteps } from "./SimpleSecretSharingState";
import { BottomInstructionRow, ChoiceSelect, ChoiceText, RowViewHeightDiceKey, SecretSharingViewContainer, ShareLetter, TopInstructionRow } from "./layout";
import { AndClause, Instruction, Instruction2 } from "../basics";
import { LoadDiceKeyViewState } from "../LoadingDiceKeys/LoadDiceKeyViewState";
import { PrintAllDiceKeySharesView, PrintAllDiceKeySharesViewPropsWrapper, PrintButtonWithWarning, PrintDiceKeyShareView, PrintDiceKeyShareViewPropsWrapper, disregardedPrintWarningViewThisSession } from "./PrintDiceKeyView";
import { CopyToPhysicalMediumWizardView, HandGeneratedBackupMediumDice, HandGeneratedBackupMediumStickers, MachineGeneratedBackupMediumPrintout } from "../BackupView";
import { ShareEntry, RowOfSharesDiv } from "./SubViews/RowOfShares";
import { Die3dView } from "./Die3dView";
import { FaceSvg } from "../SVG/FaceView";
import { CopyToPhysicalMediumWizardState } from "../../views/BackupView/CopyToPhysicalMediumWizardState";
import { StepFooterView } from "../Navigation/StepFooterView";
import { BackupStatus, BackupStatusCompletedAndValidated } from "../BackupView/BackupStatus";
import { ButtonRowSpaced } from "../../css/Button";



export interface SimpleSecretSharingProps {
	simplesSecretSharingState: SimpleSecretSharingState;
}


const DiceKeyBeingSharedRowView = observer(({
	simplesSecretSharingState,
}: {
	simplesSecretSharingState: SimpleSecretSharingState;
}) => (<DiceKeyView  
					$size={`min(80vw,${RowViewHeightDiceKey}vh)`}
					diceKey={simplesSecretSharingState.diceKeyToSplitIntoShares}
			/>));

export const SimpleSecretSharingDiceKeyAndSharesView = observer( ({
	simplesSecretSharingState,
	highlightIfCenterLetterIs
}: {
	simplesSecretSharingState: SimpleSecretSharingState;
	highlightIfCenterLetterIs?: FaceLetter | Set<FaceLetter>
}) => {
	return (<>
		<DiceKeyBeingSharedRowView {...{simplesSecretSharingState}} />
		<RowOfSharesDiv $numShares={simplesSecretSharingState.numSharesToDisplay}>{
			simplesSecretSharingState.sharesAsDiceKeysWithSource.map(({ diceKey, source }) => (
				<ShareEntry key={diceKey.centerFace.letter}
					highlightIfCenterLetterIs={highlightIfCenterLetterIs}
					numShares={simplesSecretSharingState.numSharesToDisplay}
					diceKey={diceKey}
			>{
				source
			}</ShareEntry>
		))}
		</RowOfSharesDiv>
	</>);
});

const ToPhysicalMediumRowDiv = styled.div`
	display: flex;
	flex-direction:row;
	margin: 0.5rem;
	margin-top: 0;
	gap: 1rem;
	user-select: none;
`;

const ToPhysicalMediumColumnDiv = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: start;
	align-items: center;
`;
const CheckboxContainerDiv = styled.div`
	display: flex; flex-direction: column; justify-content: end; align-items: center;
	height: 1.25rem;
	font-size: 1rem;
	font-weight: bold;
	color: green;
`;
const ToPhysicalMediumButton = styled.button.attrs({type: "button"})`
	display: flex; flex-direction: column; justify-content: center; align-items: center;
	font-size: 1.2rem;
	height: 2.25rem;
	width: 2.25rem;
	border-width: 1px;
	border-color: rgba(128,128,128,0.5);
	border-radius: 0.25rem;
	background-color: rgba(128,128,128,0.1);
	&:hover {
		background-color: rgba(128,128,128,0.25);
	}
	&:active {
		background-color: rgba(128,128,128,0);
	}
`

const ToPhysicalMediumColumnView =  observer( ({
	checked,
	children,
	...props
}: React.PropsWithChildren<{
	checked: boolean;
	title?: string;
	onClick: () => void;
}>) => {
	return (
		<ToPhysicalMediumColumnDiv>
			<CheckboxContainerDiv>{ checked ? '✓' : '' }</CheckboxContainerDiv>
			<ToPhysicalMediumButton {...props}>{children}</ToPhysicalMediumButton>
		</ToPhysicalMediumColumnDiv>
	);
});

const StepCopyToPhysicalMediumView = observer(({
	simplesSecretSharingState,
}: SimpleSecretSharingProps
) => {
	const {sharesAsDiceKeysWithSource} = simplesSecretSharingState;
	const sharesToBackup = sharesAsDiceKeysWithSource.filter(
		p => p.source !== "scanned" &&
		Object.keys(simplesSecretSharingState.physicalMediaCreatedByUserForShare[p.diceKey.centerFace.letter] ?? {}).length === 0
	).map( p => p.diceKey );
	const sharesToBackupByLetter = sharesToBackup.map( s => s.centerFace.letter );
	const [currentShareToBackup] = sharesToBackupByLetter;
	
	const {letter, digit} = sharesToBackup[0]?.centerFace ?? {letter: 'A', digit: '1'};
	return (<>
		<TopInstructionRow>
			<Instruction>Copy Share {currentShareToBackup} into physical form.</Instruction>
		</TopInstructionRow>
		<DiceKeyBeingSharedRowView {...{simplesSecretSharingState}} />
		<RowOfSharesDiv $numShares={sharesAsDiceKeysWithSource.length}>
			{sharesAsDiceKeysWithSource.map( ({diceKey}) => {
				const physicalMediaCreated = simplesSecretSharingState.physicalMediaCreatedByUserForShare[diceKey.centerFace.letter] ?? {};
				return (
					<ShareEntry
						key={diceKey.centerFace.letter}
						diceKey={diceKey}
						numShares={sharesAsDiceKeysWithSource.length}
						highlightIfCenterLetterIs={currentShareToBackup}>
						<ToPhysicalMediumRowDiv>
							<ToPhysicalMediumColumnView
								title={"Copy using dice"}
								checked={physicalMediaCreated[HandGeneratedBackupMediumDice] != null }
								onClick={simplesSecretSharingState.initiateCopyToPhysicalMediumHandler({getDiceKey: () => diceKey}, HandGeneratedBackupMediumDice)}
							>
								<Die3dView letter={letter} $size={1.5} $units={`rem`} dieColor="white" />
							</ToPhysicalMediumColumnView>
							<ToPhysicalMediumColumnView
								title={"Copy using stickers"}
								checked={physicalMediaCreated[HandGeneratedBackupMediumStickers] != null }
								onClick={simplesSecretSharingState.initiateCopyToPhysicalMediumHandler({getDiceKey: () => diceKey}, HandGeneratedBackupMediumStickers)}
							>
								<FaceSvg title="Copy using stickers"  size={`1.5rem`}
									face={{letter, digit: `${digit}`, orientationAsLowercaseLetterTrbl: 't'}}
								/>
							</ToPhysicalMediumColumnView>
							<ToPhysicalMediumColumnView
								title={`Print ${ disregardedPrintWarningViewThisSession.value ? '' : '⚠️ (not recommended)' }`}
								checked={physicalMediaCreated[MachineGeneratedBackupMediumPrintout] != null }
								onClick={simplesSecretSharingState.initiatePrintOneShareViewHandler(diceKey)}
							>
								🖨
							</ToPhysicalMediumColumnView>
						</ToPhysicalMediumRowDiv>
					</ShareEntry>
				)
			})}
		</RowOfSharesDiv>
		<BottomInstructionRow>
			<Instruction2>
				Create physical copies of Share{sharesToBackupByLetter.length > 1 ? 's' : ''} <AndClause items={sharesToBackupByLetter} />,
				using dice, stickers, or a printer (not recommended).
			</Instruction2>
			<ButtonRowSpaced>
				<PrintButtonWithWarning onClick={simplesSecretSharingState.initiatePrintAllSharesViewHandler()}>
					Print all
				</PrintButtonWithWarning>
			</ButtonRowSpaced>
		</BottomInstructionRow>
	</>);
});

const StepReplaceWithRandomView = observer(({
	simplesSecretSharingState,
}: SimpleSecretSharingProps
) => {
	const randomShareLetters = simplesSecretSharingState.sharesAsDiceKeysWithSource.filter( p => p.source === "pseudorandom" || p.source == "scanned")
		.map( p => p.diceKey.centerFace.letter );
		const calculatedShareLetters = simplesSecretSharingState.sharesAsDiceKeysWithSource.filter( p => p.source === "calculated")
		.map( p => p.diceKey.centerFace.letter );
	const randomSharesPlural = randomShareLetters.length > 1;
	const sharesToRandomize = simplesSecretSharingState.sharesAsDiceKeysWithSource.filter( p => p.source === "pseudorandom");
	const sharesToRandomizeByLetter = sharesToRandomize.map( s => s.diceKey.centerFace.letter );
	const toRandomizePlural = sharesToRandomizeByLetter.length > 1;
	const [currentShareLetterToRandomize] = sharesToRandomizeByLetter;
//	const numSharesMayBeRandom = simplesSecretSharingState.minSharesToDecode - 1;
	return (<>
		<TopInstructionRow>
			<Instruction>Replace Share {currentShareLetterToRandomize} with a hand-randomized DiceKey.</Instruction>
		</TopInstructionRow>
		<SimpleSecretSharingDiceKeyAndSharesView {...{simplesSecretSharingState}} 
			highlightIfCenterLetterIs={currentShareLetterToRandomize}
		/>
		<BottomInstructionRow>
			<Instruction2>
				Share{randomSharesPlural ? 's' : ''} <AndClause items={randomShareLetters}/> {randomSharesPlural ? 'are' : 'is'} random,
				whereas Share{calculatedShareLetters.length > 1 ? 's' : ''} <AndClause items={calculatedShareLetters} />
				{calculatedShareLetters.length > 1 ? ' are' : ' is'} calculate from {randomSharesPlural ? 'them' : 'it'}. 
				Rather than copy Share{toRandomizePlural ? 's' : ''} <AndClause items={sharesToRandomizeByLetter} />,
				it is faster to replace {toRandomizePlural ? 'them with new DiceKeys' : 'it with a new DiceKey'} you create generate by rolling dice.				
			</Instruction2><Instruction2>
				To replace Share {currentShareLetterToRandomize}, create a hand-randomized DiceKey,
				swap the die with letter {currentShareLetterToRandomize} to be the center die,
				lock it into place,
				and then scan it.
			</Instruction2>
			<button type="button" style={{alignSelf: 'center'}} onClick={() => simplesSecretSharingState.loadShareAsDiceKey()}>Scan share A</button>
		</BottomInstructionRow>
	</>);
});

const StepChooseMinAndTotalNumberOfSharesView = observer(({
	simplesSecretSharingState,
}: SimpleSecretSharingProps
) => {
	return (<>
		<TopInstructionRow>
			<Instruction>
				First, choose how many shares to divide the DiceKey with center letter&nbsp;
				<ShareLetter>{simplesSecretSharingState.diceKeyToSplitIntoShares?.centerFace.letter}</ShareLetter> into.
			</Instruction>
		</TopInstructionRow>
		<SimpleSecretSharingDiceKeyAndSharesView {...{simplesSecretSharingState}} />
		<BottomInstructionRow>
			<ChoiceText>
				Create&nbsp;<ChoiceSelect
						value={simplesSecretSharingState.numSharesToDisplay}
						onChange={ e => simplesSecretSharingState.setNumSharesToDisplay(parseInt(e.currentTarget.value)) }>{
						rangeFromTo(simplesSecretSharingState.minSharesToDecode+1, 24).map( i => (
							<option key={i} value={i}>{i}</option>
						))
				}</ChoiceSelect>&nbsp;shares,&nbsp;<ChoiceSelect
				value={simplesSecretSharingState.startDerivedShareCenterFacesAtLetter}
				onChange={ e => simplesSecretSharingState.setStartDerivedShareCenterFacesAtLetter(e.currentTarget.value as FaceLetter) }>{
				FaceLetters.map( i => (
					<option key={i} value={i}>{i}</option>
				))
			}</ChoiceSelect>&nbsp;through {simplesSecretSharingState.sharesAsDiceKeysWithSource.findLast( () => true )?.diceKey.centerFace.letter},
				any&nbsp;
					<ChoiceSelect
						value={simplesSecretSharingState.minSharesToDecode}
						onChange={ e => simplesSecretSharingState.setMinSharesToDecode(parseInt(e.currentTarget.value)) }>{
						rangeFromTo(2, simplesSecretSharingState.numSharesToDisplay - 1).map( i => (
							<option key={i} value={i}>{i}</option>
						))
					}</ChoiceSelect>&nbsp;<br/>of which can recover the DiceKey with center letter&nbsp;<ShareLetter>{simplesSecretSharingState.diceKeyToSplitIntoShares?.centerFace.letter}</ShareLetter>.

			</ChoiceText>
		</BottomInstructionRow>
	</>);
});


export const SimpleSecretSharingStepsView = observer( ({simplesSecretSharingState}: SimpleSecretSharingProps) => {
	switch (simplesSecretSharingState.step) {
		case SimpleSecretSharingSteps.ChooseMinAndTotalNumberOfShares:
			return (<StepChooseMinAndTotalNumberOfSharesView {...{simplesSecretSharingState}} />);
		case SimpleSecretSharingSteps.ReplaceWithRandom:
			return (<StepReplaceWithRandomView {...{simplesSecretSharingState}} />);
		case SimpleSecretSharingSteps.CopyToPhysicalMedium:
			return (<StepCopyToPhysicalMediumView {...{simplesSecretSharingState}} />);
		default:
			return (<></>);
	}
});

export const LoadDiceKeyShareView = observer(({simplesSecretSharingState}: {
	simplesSecretSharingState: SimpleSecretSharingState & {subView: LoadDiceKeyViewState}
}) => {
	const instruction = simplesSecretSharingState.forbiddenLetters.length === 0 ? undefined :
	`Your center die of your DiceKey cannot use ${
	 simplesSecretSharingState.forbiddenLetters.length == 1 ? `the letter ${simplesSecretSharingState.forbiddenLetters[0]}.` :
	 `the letters ${simplesSecretSharingState.forbiddenLetters.slice(0, -1).join(", ")}, or ${simplesSecretSharingState.forbiddenLetters.slice(-1)[0]}.`
	}`; 
	return (
		<LoadDiceKeyContentPaneView
			instruction={instruction}
			state={simplesSecretSharingState.subView}
			onDiceKeyReadOrCancelled={simplesSecretSharingState.onDiceKeyLoadCompletedOrCancelled}
		/>);
});

const onCopyToPhysicalMediumComplete = (
	simplesSecretSharingState: SimpleSecretSharingState & {subView: CopyToPhysicalMediumWizardState}
) => () => {
	const {getDiceKey, medium} = simplesSecretSharingState.subView;
	const centerLetter = getDiceKey()?.centerFace.letter;
	simplesSecretSharingState.clearSubView();
	if (centerLetter != null && medium != null) {
		simplesSecretSharingState.addPhysicalMediaCreatedByUserForShare(centerLetter, medium)
	}
}

export const SimpleSecretSharingView = observer(({
	onBackFromStart,
	onComplete,
	simplesSecretSharingState,
}: SimpleSecretSharingProps & {
	onBackFromStart?: () => void;
	onComplete: (status: BackupStatus) => void;
}
) => {
	if (simplesSecretSharingState.subView instanceof PrintDiceKeyShareViewPropsWrapper) {
		return (<PrintDiceKeyShareView {...simplesSecretSharingState.subView.props}/>);
	} else if (simplesSecretSharingState.subView instanceof PrintAllDiceKeySharesViewPropsWrapper) {
		return (<PrintAllDiceKeySharesView {...simplesSecretSharingState.subView.props}/>);
	} else if (simplesSecretSharingState.subView instanceof CopyToPhysicalMediumWizardState) {
		return (
			<SecretSharingViewContainer>
				<CopyToPhysicalMediumWizardView
					state={simplesSecretSharingState.subView }
					onComplete={onCopyToPhysicalMediumComplete(simplesSecretSharingState as SimpleSecretSharingState & {subView: CopyToPhysicalMediumWizardState})}
				/>
			</SecretSharingViewContainer>);
	} else if (simplesSecretSharingState.subView instanceof LoadDiceKeyViewState) {
		return <LoadDiceKeyShareView simplesSecretSharingState={simplesSecretSharingState as SimpleSecretSharingState & {subView: LoadDiceKeyViewState}} />;
	} else {
		return (
			<SecretSharingViewContainer>
				<SimpleSecretSharingStepsView {...{simplesSecretSharingState}} />
				<StepFooterView 
					prev={simplesSecretSharingState.stepPrev ?? onBackFromStart}
					next={simplesSecretSharingState.step === SimpleSecretSharingSteps.END_INCLUSIVE && simplesSecretSharingState.isStepComplete(SimpleSecretSharingSteps.END_INCLUSIVE) ?
						() => onComplete(BackupStatusCompletedAndValidated) :
						simplesSecretSharingState.stepNext}
					nextIsDone={simplesSecretSharingState.step === SimpleSecretSharingSteps.END_INCLUSIVE}
				></StepFooterView>
			</SecretSharingViewContainer>	
		);
	}
});



addPreview("SimpleSecretSharing", () => ( 
  <SimpleSecretSharingView simplesSecretSharingState={
			new SimpleSecretSharingState(NavigationPathState.root, {
				getUserSpecifiedDiceKeyToBeShared: () => DiceKeyWithoutKeyId.testExample,
				numSharesToDisplay: 5,
				minSharesToDecode: 3,
				step: 2,
			})
	 	} 
		onComplete={() => {alert("complete")}}
	/>
));