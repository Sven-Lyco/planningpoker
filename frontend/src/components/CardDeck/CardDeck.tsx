import styled from "@emotion/styled";
import type { Card } from "@planning-poker/shared";

interface CardDeckProps {
  cards: Card[];
  selectedCard: Card | null;
  onSelect: (card: Card) => void;
}

/**
 * Horizontal card picker shown during the voting phase.
 * Highlights the currently selected card.
 */
export function CardDeck({ cards, selectedCard, onSelect }: CardDeckProps) {
  return (
    <DeckWrapper>
      <DeckScroll>
        {cards.map((card) => (
          <PokerCard
            key={card}
            selected={card === selectedCard}
            onClick={() => onSelect(card)}
          >
            {card}
          </PokerCard>
        ))}
      </DeckScroll>
    </DeckWrapper>
  );
}

const DeckWrapper = styled.div`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md} 0;
  background-color: ${({ theme }) => theme.colors.surface};
  border-top: 1px solid ${({ theme }) => theme.colors.card};
`;

const DeckScroll = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 0 ${({ theme }) => theme.spacing.lg};
  overflow-x: auto;
  justify-content: center;
  flex-wrap: wrap;

  /* Hide scrollbar but keep scrollability */
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const PokerCard = styled.button<{ selected: boolean }>`
  min-width: 52px;
  height: 72px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 700;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  flex-shrink: 0;

  background-color: ${({ selected, theme }) =>
    selected ? theme.colors.primary : theme.colors.card};
  color: ${({ selected, theme }) =>
    selected ? theme.colors.textPrimary : theme.colors.textSecondary};
  border: 2px solid
    ${({ selected, theme }) =>
      selected ? theme.colors.primary : "transparent"};
  box-shadow: ${({ selected, theme }) =>
    selected ? theme.shadows.glow : "none"};

  &:hover {
    background-color: ${({ selected, theme }) =>
      selected ? theme.colors.primary : theme.colors.surface};
    color: ${({ theme }) => theme.colors.textPrimary};
    transform: translateY(-6px);
    box-shadow: ${({ theme }) => theme.shadows.card};
  }

  &:active {
    transform: translateY(-2px);
  }
`;
