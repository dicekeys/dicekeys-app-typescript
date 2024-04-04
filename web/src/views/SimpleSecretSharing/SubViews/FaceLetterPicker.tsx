import { observer } from "mobx-react";
import React from "react";
import { FaceLetter, FaceLetters } from "../../../dicekeys/DiceKey";


export const FaceLetterPicker = observer(({
	getValue, setValue, forbidden = []
}: {
	getValue: () => FaceLetter;
	setValue: (letter: FaceLetter) => void;
	forbidden?: FaceLetter | Iterable<FaceLetter>;
}
) => {
	const forbiddenSet = new Set<FaceLetter>(typeof forbidden === "string" ? [forbidden] : forbidden);
	return (
		<select value={getValue()}
			onChange={e => setValue(e.currentTarget.value as FaceLetter)}
		>{FaceLetters.filter(letter => !forbiddenSet.has(letter))
			.map(letter => (
				<option key={letter} value={letter}>{letter}</option>
			))}
		</select>
	);
});
