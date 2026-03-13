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

  return (
    <>
      <GlobalStyles />
      <AppShell>
        {room ? <GameScreen send={send} /> : <LobbyScreen send={send} />}
      </AppShell>
    </>
  );
}

const AppShell = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: ${({ theme }) => theme.colors.background};
`;
