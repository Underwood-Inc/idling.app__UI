// Mock chalk to return plain strings without colors
export const chalkMock = jest.mock('chalk', () => ({
  dim: (str: string) => str,
  blue: (str: string) => str,
  green: (str: string) => str,
  yellow: (str: string) => str,
  red: (str: string) => str,
  cyan: (str: string) => str,
  bold: (str: string) => str,
  default: {
    dim: (str: string) => str,
    blue: (str: string) => str,
    green: (str: string) => str,
    yellow: (str: string) => str,
    red: (str: string) => str,
    cyan: (str: string) => str,
    bold: (str: string) => str
  }
}));
