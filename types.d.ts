declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}

declare module "next-themes" {
  export interface ThemeProviderProps {
    children?: React.ReactNode;
    attribute?: "class" | "data-theme";
    defaultTheme?: string;
    enableSystem?: boolean;
    storageKey?: string;
  }
  export function ThemeProvider(props: ThemeProviderProps): JSX.Element;
  export function useTheme(): {
    theme: string;
    setTheme: (theme: string) => void;
    systemTheme: string;
  };
}
