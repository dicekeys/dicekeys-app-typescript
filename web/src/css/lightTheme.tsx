// theme.ts
import { DefaultTheme } from 'styled-components';

const opacityReducedEmphasis = 0.75;
const opacityDeemphasized = 0.5;

const foregroundColor = (opacity: number = 1) =>
  `rgba(0,0,0,${opacity})`;

export const lightTheme: DefaultTheme = {
  colors: {
    // white background
    background: `rgba(255,255,255,1)`,
    // black foreground
    foreground: foregroundColor(),
    foregroundReducedEmphasis: foregroundColor(opacityReducedEmphasis),
    foregroundDeemphasized: foregroundColor(opacityDeemphasized),
    // 
    navigationBar: "#5576C5",
    navigationBarForeground: "black",
    bottomButtonBarBackground: "rgba(128,128,128,1)",
    //
    highlightBackground: "yellow",
  }
};
