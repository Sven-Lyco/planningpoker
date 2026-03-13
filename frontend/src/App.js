import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "@emotion/react/jsx-runtime";
import styled from "@emotion/styled";
import { GlobalStyles } from "./styles/GlobalStyles";
import { useWebSocket } from "./hooks/useWebSocket";
import { useAppSelector } from "./store/hooks";
import { LobbyScreen } from "./screens/LobbyScreen";
import { GameScreen } from "./screens/GameScreen";
/**
 * Root application component.
 * Manages the WebSocket connection and routes between the lobby and game screen.
 */
export function App() {
    const { send } = useWebSocket();
    const room = useAppSelector((state) => state.room.room);
    return (_jsxs(_Fragment, { children: [_jsx(GlobalStyles, {}), _jsx(AppShell, { children: room ? _jsx(GameScreen, { send: send }) : _jsx(LobbyScreen, { send: send }) })] }));
}
const AppShell = styled.div `
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: ${({ theme }) => theme.colors.background};
`;
