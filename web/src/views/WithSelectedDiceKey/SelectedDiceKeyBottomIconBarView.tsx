import React from "react";
import { observer } from "mobx-react";
import imageOfDiceKeyIcon from /*url:*/ "../../images/DiceKey Icon.svg";
import imageOfUsbKey from /*url:*/ "../../images/USB Key.svg";
import imageOfSecretWithArrow from /*url:*/ "../../images/Secret with Arrow.svg";
import imageOfBackup from /*url:*/ "../../images/Backup to DiceKey.svg";
import { EventHandlerOverridesDefault } from "../../utilities/EventHandlerOverridesDefault";
import { SelectedDiceKeyViewProps } from "./SelectedDiceKeyViewProps";
import styled from "styled-components";
import { NavigationBar } from "../Navigation/NavigationLayout";
import { DisplayDiceKeyViewState } from "./SelectedDiceKeyViewState";
import { SeedHardwareKeyViewState } from "../../views/Recipes/SeedHardwareKeyViewState";
import { SecretDerivationViewState } from "../../views/Recipes/DerivationView";
import { BackupDiceKeyState } from "../BackupView/BackupDiceKeyState";
import { StandardBottomBarHeight } from "../../views/Navigation/NavigationLayout";

export const BottomIconNavigationBar = styled(NavigationBar)`
	@media screen {
		height: ${StandardBottomBarHeight};
		background-color: ${props=>props.theme.colors.bottomButtonBarBackground};
		align-items: baseline;
	}
`;

export const FooterButtonDiv = styled.div<{selected: boolean}>`
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	width: 25vw;
	padding-right: 0;
	padding-left: 0;
	margin-top: 1vh;
	margin-bottom: 1vh;
	cursor: grab;
	user-select: none;
	filter: ${(props) => props.selected ? `invert(100%)` : `invert(0%)` };
	&:hover {
		filter: invert(75%);
	}
`;

export const FooterIconImg = styled.img`
	display: flex;
	max-height: 5vh;
	flex-basis: 0;
	flex-grow: 1;
`;
const FooterButtonView = observer( ( {isSelected, imageSrc, onClick, children}: React.PropsWithChildren<{
	isSelected: () => boolean;
	imageSrc: string;
	onClick: () => void;
}> ) => (
	<FooterButtonDiv selected={isSelected()}
		onClick={EventHandlerOverridesDefault(onClick)}
	><FooterIconImg src={imageSrc}/><div>{children}</div>
	</FooterButtonDiv>
));

export const SelectedDiceKeyBottomIconBarView = observer( ( props: SelectedDiceKeyViewProps) => {
	const {state} = props;
	const {subViewState} = state.subView;
	return (
		<BottomIconNavigationBar>
			<FooterButtonView {...props}
				isSelected={() => subViewState == null || subViewState instanceof DisplayDiceKeyViewState} imageSrc={imageOfDiceKeyIcon} onClick={state.navigateToDisplayDiceKey}>
					DiceKey
			</FooterButtonView>
			<FooterButtonView {...props}
				isSelected={() => subViewState instanceof SeedHardwareKeyViewState} imageSrc={imageOfUsbKey} onClick={state.navigateToSeedHardwareKey}>
					Seed
			</FooterButtonView>
			<FooterButtonView {...props}
				isSelected={() => subViewState instanceof SecretDerivationViewState} imageSrc={imageOfSecretWithArrow} onClick={state.navigateToDeriveSecrets}>
					Secret
			</FooterButtonView>
			<FooterButtonView {...props}
				isSelected={() => subViewState instanceof BackupDiceKeyState} imageSrc={imageOfBackup} onClick={state.navigateToBackup}>
					Backup
			</FooterButtonView>
		</BottomIconNavigationBar>
	);
});