import styled from "@emotion/styled";
import { GlobalStyles } from "./styles/GlobalStyles";
import { useWebSocket } from "./hooks/useWebSocket";
import { useAppSelector } from "./store/hooks";
import type { AppTheme } from "./styles/theme";

/**
 * Root application component.
 * Initialises the WebSocket connection and renders the appropriate view
 * based on whether the player is currently in a room.
 */
export function App() {
  useWebSocket();
  const room = useAppSelector((state) => state.room.room);

  return (
    <>
      <GlobalStyles />
      <AppShell>
        {room ? (
          <p style={{ color: "white" }}>Room: {room.id}</p>
        ) : (
          <p style={{ color: "white" }}>Not in a room yet.</p>
        )}
      </AppShell>
    </>
  );
}

const AppShell = styled.div<{ theme?: AppTheme }>`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: ${({ theme }) => (theme as AppTheme).colors.background};
`;
