import { jsx as _jsx } from "@emotion/react/jsx-runtime";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { ThemeProvider } from "@emotion/react";
import { store } from "./store";
import { theme } from "./styles/theme";
import { App } from "./App";
const root = document.getElementById("root");
if (!root)
    throw new Error("Root element #root not found in DOM.");
createRoot(root).render(_jsx(StrictMode, { children: _jsx(Provider, { store: store, children: _jsx(ThemeProvider, { theme: theme, children: _jsx(App, {}) }) }) }));
