declare module 'chalk' {
  type ColorFunction = (text: string) => string;
  
  interface ChalkModule {
    (text: string): string;
    red: ColorFunction;
    green: ColorFunction;
    yellow: ColorFunction;
    blue: ColorFunction;
    magenta: ColorFunction;
    cyan: ColorFunction;
    white: ColorFunction;
    gray: ColorFunction;
    grey: ColorFunction;
    black: ColorFunction;
    bold: ColorFunction;
    italic: ColorFunction;
    underline: ColorFunction;
    inverse: ColorFunction;
    strikethrough: ColorFunction;
    dim: ColorFunction;
    bgRed: ColorFunction;
    bgGreen: ColorFunction;
    bgYellow: ColorFunction;
    bgBlue: ColorFunction;
    bgMagenta: ColorFunction;
    bgCyan: ColorFunction;
    bgWhite: ColorFunction;
    bgBlack: ColorFunction;
    // Chainable methods
    rgb: (r: number, g: number, b: number) => ColorFunction;
    hex: (color: string) => ColorFunction;
  }

  const chalk: ChalkModule;
  export default chalk;
}