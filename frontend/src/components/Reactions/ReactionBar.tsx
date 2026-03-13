import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import styled from "@emotion/styled";
import type { ClientMessage } from "@planning-poker/shared";
import { useEmojiGroups } from "../../hooks/useEmojiGroups";
import type { EmojiItem } from "../../hooks/useEmojiGroups";

const DEFAULT_EMOJIS = ["💩", "🪨", "🚀", "❤️"];

interface ReactionBarProps {
  /** The player this bar is attached to – reactions will fly toward them. */
  targetPlayerId: string;
  send: (message: ClientMessage) => void;
}

/**
 * Shows 4 quick-send emoji slots and a "+" button to open a full emoji picker.
 * The 4th slot is replaced by whatever the user selects from the picker.
 * Appears on hover over a PlayerSeat.
 */
export function ReactionBar({ targetPlayerId, send }: ReactionBarProps) {
  const [customEmoji, setCustomEmoji] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerPos, setPickerPos] = useState({ x: 0, y: 0, flipDown: false });
  const plusRef = useRef<HTMLButtonElement>(null);

  const emojis = [
    DEFAULT_EMOJIS[0],
    DEFAULT_EMOJIS[1],
    DEFAULT_EMOJIS[2],
    customEmoji ?? DEFAULT_EMOJIS[3],
  ];

  const handleSend = (emoji: string) => {
    send({ type: "SEND_REACTION", emoji, targetPlayerId });
  };

  const handlePlusClick = () => {
    if (!plusRef.current) return;
    const rect = plusRef.current.getBoundingClientRect();
    const flipDown = rect.top < 340; // not enough room above for the 320px picker
    setPickerPos({ x: rect.left + rect.width / 2, y: flipDown ? rect.bottom : rect.top, flipDown });
    setShowPicker(true);
  };

  const handlePickerSelect = (emoji: string) => {
    setCustomEmoji(emoji);
    setShowPicker(false);
    send({ type: "SEND_REACTION", emoji, targetPlayerId });
  };

  return (
    <Bar>
      {emojis.map((emoji, i) => (
        <EmojiButton key={i} onClick={() => handleSend(emoji)} title={emoji}>
          {emoji}
        </EmojiButton>
      ))}
      <PlusButton ref={plusRef} onClick={handlePlusClick} title="More emojis">
        +
      </PlusButton>

      {showPicker &&
        createPortal(
          <EmojiPicker
            pos={pickerPos}
            onSelect={handlePickerSelect}
            onClose={() => setShowPicker(false)}
          />,
          document.body
        )}
    </Bar>
  );
}

// --- Emoji Picker ---

interface EmojiPickerProps {
  pos: { x: number; y: number; flipDown: boolean };
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

function EmojiPicker({ pos, onSelect, onClose }: EmojiPickerProps) {
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const groups = useEmojiGroups();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const searchTerm = search.trim().toLowerCase();
  const filtered: EmojiItem[] | null = searchTerm && groups
    ? groups.flatMap((g) => g.emojis).filter((e) => e.name.toLowerCase().includes(searchTerm))
    : null;

  const transform = pos.flipDown
    ? "translate(-50%, 8px)"
    : "translate(-50%, calc(-100% - 8px))";

  return (
    <PickerContainer
      ref={ref}
      style={{ left: pos.x, top: pos.y, transform }}
    >
      <SearchRow>
        <SearchInput
          autoFocus
          placeholder="Search emoji…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </SearchRow>

      {!groups ? (
        <LoadingHint>Loading…</LoadingHint>
      ) : filtered ? (
        filtered.length === 0 ? (
          <LoadingHint>No results for "{search}"</LoadingHint>
        ) : (
          <EmojiGrid>
            {filtered.map((item, i) => (
              <PickerEmoji key={i} title={item.name} onClick={() => onSelect(item.emoji)}>
                {item.emoji}
              </PickerEmoji>
            ))}
          </EmojiGrid>
        )
      ) : (
        groups.map((group) => (
          <section key={group.label}>
            <GroupLabel>{group.label}</GroupLabel>
            <EmojiGrid>
              {group.emojis.map((item, i) => (
                <PickerEmoji key={i} title={item.name} onClick={() => onSelect(item.emoji)}>
                  {item.emoji}
                </PickerEmoji>
              ))}
            </EmojiGrid>
          </section>
        ))
      )}
    </PickerContainer>
  );
}

// --- Styled components ---

const LoadingHint = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  padding: ${({ theme }) => theme.spacing.sm};
  text-align: center;
`;

const Bar = styled.div`
  display: flex;
  gap: 2px;
  align-items: center;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.card};
  border-radius: ${({ theme }) => theme.radii.full};
  padding: 4px 8px;
  box-shadow: ${({ theme }) => theme.shadows.card};
`;

const EmojiButton = styled.button`
  font-size: 18px;
  padding: 4px 5px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: transparent;
  cursor: pointer;
  line-height: 1;
  transition: transform ${({ theme }) => theme.transitions.fast},
    background-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background-color: ${({ theme }) => theme.colors.card};
    transform: scale(1.3);
  }

  &:active {
    transform: scale(1.05);
  }
`;

const PlusButton = styled.button`
  font-size: 14px;
  font-weight: 700;
  width: 26px;
  height: 26px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.card};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`;

const PickerContainer = styled.div`
  position: fixed;
  z-index: 1000;
  width: 280px;
  max-height: 320px;
  overflow-y: auto;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.card};
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.shadows.card};
  padding: ${({ theme }) => theme.spacing.sm};
`;

const SearchRow = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 6px 10px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.card};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSizes.md};
  outline: none;
  box-sizing: border-box;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const GroupLabel = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 600;
  margin: ${({ theme }) => theme.spacing.xs} 0 4px;
`;

const EmojiGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
`;

const PickerEmoji = styled.button`
  font-size: 22px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: transparent;
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.transitions.fast},
    transform ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.card};
    transform: scale(1.2);
  }
`;
