// import original module declarations
import "styled-components";

// and extend them!
declare module "styled-components" {
  export interface DefaultTheme {
    // borderRadius: string;

    colors: {
      foreground: string;
      background: string;
      navigationBar: string;
      navigationBarForeground: string;
    };
  }
}