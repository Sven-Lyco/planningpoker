import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { ThemeProvider } from "@emotion/react";
import { store } from "./store";
import { theme } from "./styles/theme";
import { App } from "./App";

const root = document.getElementById("root");
if (!root) throw new Error("Root element #root not found in DOM.");

createRoot(root).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    </Provider>
  </StrictMode>
);
