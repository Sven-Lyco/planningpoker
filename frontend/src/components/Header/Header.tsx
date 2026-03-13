import styled from "@emotion/styled";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import type { Player, Room } from "@planning-poker/shared";

interface HeaderProps {
  room: Room;
  currentPlayer: Player | null;
}

/**
 * Top bar showing room info, player count, and invite link copy button.
 */
export function Header({ room, currentPlayer }: HeaderProps) {
  const inviteUrl = `${window.location.origin}?room=${room.id}`;

  const copyInvite = () => {
    void navigator.clipboard.writeText(inviteUrl);
  };

  const phaseLabel: Record<Room["phase"], string> = {
    waiting: "Waiting",
    voting: "Voting",
    reveal: "Results",
  };

  return (
    <HeaderBar>
      <LeftSection>
        <Logo>🃏 Planning Poker</Logo>
        <RoomInfo>
          <RoomId>{room.id}</RoomId>
          <Badge>{room.players.length} player{room.players.length !== 1 ? "s" : ""}</Badge>
          <Badge variant={room.phase === "voting" ? "accent" : room.phase === "reveal" ? "warning" : "default"}>
            {phaseLabel[room.phase]}
          </Badge>
        </RoomInfo>
      </LeftSection>

      <RightSection>
        <Button variant="secondary" size="sm" onClick={copyInvite}>
          Copy invite link
        </Button>
        {currentPlayer && (
          <CurrentPlayer>
            <Avatar config={currentPlayer.avatar} size={32} />
            <PlayerName>{currentPlayer.name}</PlayerName>
          </CurrentPlayer>
        )}
      </RightSection>
    </HeaderBar>
  );
}

const HeaderBar = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${({ theme }) => theme.spacing.lg};
  height: 60px;
  background-color: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.card};
  flex-shrink: 0;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const Logo = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const RoomInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const RoomId = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  font-family: monospace;
  letter-spacing: 1px;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const CurrentPlayer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const PlayerName = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textSecondary};
`;
