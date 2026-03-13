import { jsx as _jsx, jsxs as _jsxs } from "@emotion/react/jsx-runtime";
import styled from "@emotion/styled";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
/**
 * Top bar showing room info, player count, and invite link copy button.
 */
export function Header({ room, currentPlayer }) {
    const inviteUrl = `${window.location.origin}?room=${room.id}`;
    const copyInvite = () => {
        void navigator.clipboard.writeText(inviteUrl);
    };
    const phaseLabel = {
        waiting: "Waiting",
        voting: "Voting",
        reveal: "Results",
    };
    return (_jsxs(HeaderBar, { children: [_jsxs(LeftSection, { children: [_jsx(Logo, { children: "\uD83C\uDCCF Planning Poker" }), _jsxs(RoomInfo, { children: [_jsx(RoomId, { children: room.id }), _jsxs(Badge, { children: [room.players.length, " player", room.players.length !== 1 ? "s" : ""] }), _jsx(Badge, { variant: room.phase === "voting" ? "accent" : room.phase === "reveal" ? "warning" : "default", children: phaseLabel[room.phase] })] })] }), _jsxs(RightSection, { children: [_jsx(Button, { variant: "secondary", size: "sm", onClick: copyInvite, children: "Copy invite link" }), currentPlayer && (_jsxs(CurrentPlayer, { children: [_jsx(Avatar, { config: currentPlayer.avatar, size: 32 }), _jsx(PlayerName, { children: currentPlayer.name })] }))] })] }));
}
const HeaderBar = styled.header `
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${({ theme }) => theme.spacing.lg};
  height: 60px;
  background-color: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.card};
  flex-shrink: 0;
`;
const LeftSection = styled.div `
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
`;
const Logo = styled.span `
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
`;
const RoomInfo = styled.div `
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;
const RoomId = styled.span `
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  font-family: monospace;
  letter-spacing: 1px;
`;
const RightSection = styled.div `
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;
const CurrentPlayer = styled.div `
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;
const PlayerName = styled.span `
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textSecondary};
`;
