// import {createCanvas} from "canvas";
// import {
//   renderDiceKey,
//   renderFaceFactory
// } from "../dicekeys/render";
// import {writeFileSync} from "fs";
// import {
//   DiceKey,
//   DiceKeyInHumanReadableForm
// } from "../dicekeys/dicekey";

// test('Render A1', async () => {
//   const canvas = createCanvas(500, 500, "svg");
//   const ctx = canvas.getContext("2d");
//   const renderFace = renderFaceFactory(100);
//   renderFace(ctx, {letter: "A", digit: "1", orientationAsLowercaseLetterTRBL: "t"}, {x: 250, y: 250});
//   writeFileSync("test-outputs/A1t.svg", canvas.toBuffer());
// });

// test('Render DiceKey', async () => {
//   const diceKey = DiceKey.fromHumanReadableForm("D2lC5rP1bK5bT1bY2bU1tG3rB6rZ5bS2tV5bO5bM4rJ4bX1tN6tA5rH1rW4lR4lE5bL1bI6rF6b" as DiceKeyInHumanReadableForm)  
//   const canvas = createCanvas(500, 500, "svg");
//   const ctx = canvas.getContext("2d");
//   console.log("nevermind", diceKey, ctx)
//   renderDiceKey(ctx, diceKey);
//   writeFileSync("test-outputs/D2lC5rP1bK5bT1bY2bU1tG3rB6rZ5bS2tV5bO5bM4rJ4bX1tN6tA5rH1rW4lR4lE5bL1bI6rF6b.svg", canvas.toBuffer());
// });
