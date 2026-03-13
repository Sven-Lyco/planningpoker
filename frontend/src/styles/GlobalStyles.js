import { jsx as _jsx } from "@emotion/react/jsx-runtime";
import { Global, css, useTheme } from "@emotion/react";
/**
 * Global CSS reset and base styles.
 * Renders once at the app root via `<GlobalStyles />`.
 */
export function GlobalStyles() {
    const theme = useTheme();
    return (_jsx(Global, { styles: css `
        *,
        *::before,
        *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html,
        body,
        #root {
          height: 100%;
        }

        body {
          background-color: ${theme.colors.background};
          color: ${theme.colors.textPrimary};
          font-family: "Inter", system-ui, -apple-system, sans-serif;
          font-size: ${theme.fontSizes.md};
          line-height: 1.5;
          -webkit-font-smoothing: antialiased;
        }

        button {
          cursor: pointer;
          border: none;
          background: none;
          font: inherit;
        }

        input,
        textarea {
          font: inherit;
        }
      ` }));
}
