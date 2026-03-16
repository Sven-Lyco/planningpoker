import { useState, useEffect } from "react";
import styled from "@emotion/styled";
import type { ClientMessage, RoomSettings } from "@planning-poker/shared";
import { VOTING_SYSTEMS } from "@planning-poker/shared";
import { useAppSelector } from "../store/hooks";
import { Header } from "../components/Header/Header";
import { Table } from "../components/Table/Table";
import { CardDeck } from "../components/CardDeck/CardDeck";
import { Reactions } from "../components/Reactions/Reactions";
import { SettingsModal } from "../components/Settings/SettingsModal";

interface GameScreenProps {
  send: (message: ClientMessage) => void;
}

/**
 * Main game screen shown when the player is in a room.
 * Renders the header, table, card deck, and reaction overlay.
 */
export function GameScreen({ send }: GameScreenProps) {
  const room = useAppSelector((state) => state.room.room);
  const playerId = useAppSelector((state) => state.player.playerId);

  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Reset card selection whenever a new voting round starts
  useEffect(() => {
    if (room?.phase === "voting") {
      setSelectedCard(null);
    }
  }, [room?.phase]);

  // Auto-reveal: when enabled and all players have voted, the facilitator triggers reveal
  useEffect(() => {
    if (!room || !playerId) return;
    const { phase, settings, currentVotes, players } = room;
    if (
      phase === "voting" &&
      settings.autoReveal &&
      playerId === settings.facilitatorId &&
      players.length > 0 &&
      players.every((p) => currentVotes[p.id] !== null && currentVotes[p.id] !== undefined)
    ) {
      send({ type: "REVEAL_CARDS" });
    }
  }, [room, playerId, send]);

  if (!room || !playerId) return null;

  const currentPlayer = room.players.find((p) => p.id === playerId) ?? null;
  const isFacilitator = playerId === room.settings.facilitatorId;

  const activeDeck =
    room.settings.votingSystem === "custom"
      ? (room.settings.customDeck ?? [])
      : VOTING_SYSTEMS[room.settings.votingSystem];

  const handleCardSelect = (card: string) => {
    setSelectedCard(card);
    send({ type: "VOTE", card });
  };

  const handleReveal = () => {
    send({ type: "REVEAL_CARDS" });
  };

  const handleNewVoting = () => {
    setSelectedCard(null);
    send({ type: "NEW_VOTING" });
  };

  const handleUpdateSettings = (settings: Partial<RoomSettings>) => {
    send({ type: "UPDATE_SETTINGS", settings });
  };

  return (
    <Screen>
      <Header
        room={room}
        currentPlayer={currentPlayer}
        onSettingsClick={isFacilitator ? () => setIsSettingsOpen(true) : undefined}
      />

      <MainArea>
        <Reactions />
        <Table
          room={room}
          currentPlayerId={playerId}
          onReveal={handleReveal}
          onNewVoting={handleNewVoting}
          send={send}
        />
      </MainArea>

      <BottomBar>
        {room.phase === "voting" && (
          <CardDeck
            cards={activeDeck}
            selectedCard={selectedCard}
            onSelect={handleCardSelect}
          />
        )}
      </BottomBar>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleUpdateSettings}
        currentSettings={room.settings}
      />
    </Screen>
  );
}

const Screen = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const MainArea = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: visible;
  position: relative;
`;

const BottomBar = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;
