import { useCallback, useEffect, useRef } from "react";
import type { ClientMessage, ServerMessage } from "@planning-poker/shared";
import { useAppDispatch } from "../store/hooks";
import { setPlayerIdentity } from "../store/playerSlice";
import { clearRoom, updateRoom } from "../store/roomSlice";

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:3001/ws";
const RECONNECT_DELAY_MS = 3000;

/**
 * Manages the WebSocket connection to the planning poker server.
 * Dispatches Redux actions on incoming messages.
 * Exposes a `send` function for outgoing messages.
 *
 * @returns `send` – function to send a typed ClientMessage to the server.
 */
export function useWebSocket() {
  const dispatch = useAppDispatch();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  const send = useCallback((message: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      let message: ServerMessage;
      try {
        message = JSON.parse(event.data as string) as ServerMessage;
      } catch {
        console.error("[WS] Failed to parse message:", event.data);
        return;
      }

      switch (message.type) {
        case "ROOM_CREATED":
          // playerId is stored once; avatar/name will be set by the calling component
          dispatch(
            setPlayerIdentity({
              playerId: message.playerId,
              playerName: "",
              avatar: { style: "bottts", seed: "" },
            })
          );
          break;

        case "ROOM_UPDATED":
          dispatch(updateRoom(message.room));
          break;

        case "PLAYER_JOINED":
          // Room state is updated via ROOM_UPDATED; no separate action needed
          break;

        case "CARDS_REVEALED":
          // Reveal is reflected in the ROOM_UPDATED snapshot; handled there
          break;

        case "REACTION":
          // Handled by a separate reactions listener (to be added with the Reactions component)
          break;

        case "ERROR":
          console.error("[WS] Server error:", message.message);
          break;
      }
    },
    [dispatch]
  );

  const connect = useCallback(() => {
    if (!isMountedRef.current) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onmessage = handleMessage;

    ws.onclose = () => {
      if (!isMountedRef.current) return;
      dispatch(clearRoom());
      reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [dispatch, handleMessage]);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { send };
}
