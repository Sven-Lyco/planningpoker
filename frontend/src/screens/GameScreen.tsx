import { useState } from "react";
import styled from "@emotion/styled";
import type { ClientMessage } from "@planning-poker/shared";
import { VOTING_SYSTEMS } from "@planning-poker/shared";
import { useAppSelector } from "../store/hooks";
import { Header } from "../components/Header/Header";
import { Table } from "../components/Table/Table";
import { CardDeck } from "../components/CardDeck/CardDeck";
import { Reactions } from "../components/Reactions/Reactions";
import { ReactionBar } from "../components/Reactions/ReactionBar";

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

  if (!room || !playerId) return null;

  const currentPlayer = room.players.find((p) => p.id === playerId) ?? null;

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

  return (
    <Screen>
      <Header room={room} currentPlayer={currentPlayer} />

      <MainArea>
        <Reactions />
        <Table
          room={room}
          currentPlayerId={playerId}
          onReveal={handleReveal}
          onNewVoting={handleNewVoting}
        />
      </MainArea>

      <BottomBar>
        {room.settings.funFeatures && <ReactionBar send={send} />}
        {room.phase === "voting" && (
          <CardDeck
            cards={activeDeck}
            selectedCard={selectedCard}
            onSelect={handleCardSelect}
          />
        )}
      </BottomBar>
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
  overflow: hidden;
  position: relative;
`;

const BottomBar = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;
