import { jsx as _jsx, jsxs as _jsxs } from "@emotion/react/jsx-runtime";
import { useState } from "react";
import styled from "@emotion/styled";
import { VOTING_SYSTEMS } from "@planning-poker/shared";
import { useAppSelector } from "../store/hooks";
import { Header } from "../components/Header/Header";
import { Table } from "../components/Table/Table";
import { CardDeck } from "../components/CardDeck/CardDeck";
/**
 * Main game screen shown when the player is in a room.
 * Renders the header, table, and card deck based on the current game phase.
 */
export function GameScreen({ send }) {
    const room = useAppSelector((state) => state.room.room);
    const playerId = useAppSelector((state) => state.player.playerId);
    const [selectedCard, setSelectedCard] = useState(null);
    if (!room || !playerId)
        return null;
    const currentPlayer = room.players.find((p) => p.id === playerId) ?? null;
    const activeDeck = room.settings.votingSystem === "custom"
        ? (room.settings.customDeck ?? [])
        : VOTING_SYSTEMS[room.settings.votingSystem];
    const handleCardSelect = (card) => {
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
    return (_jsxs(Screen, { children: [_jsx(Header, { room: room, currentPlayer: currentPlayer }), _jsx(MainArea, { children: _jsx(Table, { room: room, currentPlayerId: playerId, onReveal: handleReveal, onNewVoting: handleNewVoting }) }), room.phase === "voting" && (_jsx(CardDeck, { cards: activeDeck, selectedCard: selectedCard, onSelect: handleCardSelect }))] }));
}
const Screen = styled.div `
  display: flex;
  flex-direction: column;
  height: 100%;
`;
const MainArea = styled.main `
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;
