import styled from "@emotion/styled";
import type { ClientMessage } from "@planning-poker/shared";

const EMOJIS = ["👍", "❤️", "😂", "🎉", "🤔", "😱", "☕"];

interface ReactionBarProps {
  send: (message: ClientMessage) => void;
}

/**
 * A row of emoji buttons that broadcast reactions to all players in the room.
 */
export function ReactionBar({ send }: ReactionBarProps) {
  const handleClick = (emoji: string) => {
    send({ type: "SEND_REACTION", emoji });
  };

  return (
    <Bar>
      {EMOJIS.map((emoji) => (
        <EmojiButton key={emoji} onClick={() => handleClick(emoji)} title={emoji}>
          {emoji}
        </EmojiButton>
      ))}
    </Bar>
  );
}

const Bar = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: center;
  padding: ${({ theme }) => theme.spacing.sm} 0;
`;

const EmojiButton = styled.button`
  font-size: 20px;
  padding: 4px 6px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: transparent;
  cursor: pointer;
  transition: transform ${({ theme }) => theme.transitions.fast},
    background-color ${({ theme }) => theme.transitions.fast};
  line-height: 1;

  &:hover {
    background-color: ${({ theme }) => theme.colors.card};
    transform: scale(1.25);
  }

  &:active {
    transform: scale(1.05);
  }
`;
