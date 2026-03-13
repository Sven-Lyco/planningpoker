import styled from "@emotion/styled";
import type { Player } from "@planning-poker/shared";
import { Avatar } from "../ui/Avatar";

interface PlayerSeatProps {
  player: Player;
  /** The card value this player voted for – only shown in reveal phase. */
  vote?: string | null;
  /** Whether cards are currently being revealed. */
  isRevealed: boolean;
  /** Whether this is the local player. */
  isCurrentPlayer: boolean;
}

/**
 * Displays a player's avatar, name, and vote status at the table.
 */
export function PlayerSeat({ player, vote, isRevealed, isCurrentPlayer }: PlayerSeatProps) {
  const cardLabel = isRevealed ? (vote ?? "–") : player.hasVoted ? "✓" : "?";
  const cardActive = isRevealed ? true : player.hasVoted;

  return (
    <Seat isCurrentPlayer={isCurrentPlayer}>
      <CardChip active={cardActive} revealed={isRevealed}>
        {cardLabel}
      </CardChip>
      <Avatar config={player.avatar} size={44} />
      <PlayerName isCurrentPlayer={isCurrentPlayer}>{player.name}</PlayerName>
      {player.isHost && <HostBadge>Host</HostBadge>}
    </Seat>
  );
}

const Seat = styled.div<{ isCurrentPlayer: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 72px;
  opacity: ${({ isCurrentPlayer }) => (isCurrentPlayer ? 1 : 0.9)};
`;

const CardChip = styled.div<{ active: boolean; revealed: boolean }>`
  width: 40px;
  height: 56px;
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 2px solid
    ${({ active, revealed, theme }) =>
      revealed ? theme.colors.accent : active ? theme.colors.primary : theme.colors.card};
  background-color: ${({ active, revealed, theme }) =>
    revealed ? `${theme.colors.accent}22` : active ? `${theme.colors.primary}22` : theme.colors.surface};
  color: ${({ active, revealed, theme }) =>
    revealed ? theme.colors.accent : active ? theme.colors.primary : theme.colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 700;
  transition: all ${({ theme }) => theme.transitions.normal};
`;

const PlayerName = styled.span<{ isCurrentPlayer: boolean }>`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ isCurrentPlayer, theme }) =>
    isCurrentPlayer ? theme.colors.textPrimary : theme.colors.textSecondary};
  font-weight: ${({ isCurrentPlayer }) => (isCurrentPlayer ? 600 : 400)};
  max-width: 80px;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const HostBadge = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.accent};
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;
