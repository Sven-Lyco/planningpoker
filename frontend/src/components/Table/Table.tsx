import styled from "@emotion/styled";
import type { ClientMessage, Player, Room } from "@planning-poker/shared";
import { PlayerSeat } from "../PlayerSeat/PlayerSeat";
import { Stats } from "../Stats/Stats";
import { Button } from "../ui/Button";

interface TableProps {
  room: Room;
  currentPlayerId: string;
  onReveal: () => void;
  onNewVoting: () => void;
  /** When provided and funFeatures is enabled, players get a hover reaction bar. */
  send?: (message: ClientMessage) => void;
}

interface DistributedPlayers {
  top: Player[];
  left: Player[];
  right: Player[];
  bottom: Player[];
}

/**
 * Distributes players around the four sides of the table.
 * Side columns grow for larger groups; top/bottom fill the rest symmetrically.
 */
function distributeAroundTable(others: Player[]): DistributedPlayers {
  const n = others.length;
  // Allow up to 3 players per side column, one side slot per 4 total players
  const sideCount = Math.min(3, Math.floor(n / 4));
  const remaining = n - 2 * sideCount;
  const topCount = Math.ceil(remaining / 2);

  return {
    top:    others.slice(0, topCount),
    left:   others.slice(topCount, topCount + sideCount),
    right:  others.slice(topCount + sideCount, topCount + 2 * sideCount),
    bottom: others.slice(topCount + 2 * sideCount),
  };
}

/**
 * Renders the poker table with players arranged around it and a context-aware center panel.
 * Current player is always placed in the bottom row.
 */
export function Table({ room, currentPlayerId, onReveal, onNewVoting, send }: TableProps) {
  const { players, phase, currentVotes, settings } = room;

  const currentPlayer = players.find((p) => p.id === currentPlayerId) ?? null;
  const otherPlayers = players.filter((p) => p.id !== currentPlayerId);
  const { top, left, right, bottom } = distributeAroundTable(otherPlayers);

  const isFacilitator = currentPlayerId === settings.facilitatorId;
  const canReveal =
    phase === "voting" &&
    (settings.whoCanReveal === "all" || isFacilitator);

  const renderSeat = (p: Player) => (
    <PlayerSeat
      key={p.id}
      player={p}
      vote={currentVotes[p.id]}
      isRevealed={phase === "reveal"}
      isCurrentPlayer={false}
      send={send}
    />
  );

  return (
    <TableContainer>
      <PlayerRow>{top.map(renderSeat)}</PlayerRow>

      <MiddleRow>
        <SideColumn>{left.map(renderSeat)}</SideColumn>

        <TableOval>
          <TableContent>
            {phase === "waiting" && (
              <>
                <PhaseTitle>Waiting for players</PhaseTitle>
                <PhaseSubtitle>
                  {players.length} player{players.length !== 1 ? "s" : ""} joined
                </PhaseSubtitle>
                {isFacilitator && (
                  <Button onClick={onNewVoting} size="md" style={{ marginTop: 12 }}>
                    Start Voting
                  </Button>
                )}
                {!isFacilitator && (
                  <PhaseSubtitle>Waiting for host to start…</PhaseSubtitle>
                )}
              </>
            )}

            {phase === "voting" && (
              <>
                <PhaseTitle>Pick your card!</PhaseTitle>
                <VotedCount>
                  {players.filter((p) => p.hasVoted).length} / {players.length} voted
                </VotedCount>
                {canReveal && (
                  <Button onClick={onReveal} size="md" style={{ marginTop: 12 }}>
                    Reveal cards
                  </Button>
                )}
              </>
            )}

            {phase === "reveal" && (
              <>
                <Stats votes={currentVotes} />
                {isFacilitator && (
                  <Button
                    onClick={onNewVoting}
                    size="md"
                    variant="secondary"
                    style={{ marginTop: 12 }}
                  >
                    New round
                  </Button>
                )}
              </>
            )}
          </TableContent>
        </TableOval>

        <SideColumn>{right.map(renderSeat)}</SideColumn>
      </MiddleRow>

      <PlayerRow>
        {bottom.map(renderSeat)}
        {currentPlayer && (
          <PlayerSeat
            player={currentPlayer}
            vote={currentVotes[currentPlayer.id]}
            isRevealed={phase === "reveal"}
            isCurrentPlayer={true}
          />
        )}
      </PlayerRow>
    </TableContainer>
  );
}

const TableContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.lg};
  gap: ${({ theme }) => theme.spacing.lg};
  min-height: 0;
`;

const PlayerRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xl};
  align-items: flex-end;
  flex-wrap: wrap;
  justify-content: center;
  min-height: 80px;
`;

const MiddleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.lg};
  flex: 1;
  width: 100%;
`;

const SideColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  align-items: center;
  justify-content: center;
  min-width: 80px;
`;

const TableOval = styled.div`
  width: min(520px, 90vw);
  min-height: 180px;
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.surface} 0%,
    ${({ theme }) => theme.colors.card} 100%
  );
  border-radius: 100px;
  border: 2px solid ${({ theme }) => theme.colors.card};
  box-shadow: ${({ theme }) => theme.shadows.card};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.xl};
`;

const TableContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  text-align: center;
  width: 100%;
`;

const PhaseTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const PhaseSubtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const VotedCount = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.accent};
  font-weight: 600;
`;
