import styled from "@emotion/styled";
import type { Card } from "@planning-poker/shared";

interface StatsProps {
  votes: Record<string, Card | null>;
  showAverage?: boolean;
}

/** Cards that are not numeric (excluded from average). */
const NON_NUMERIC = new Set(["?", "☕"]);

/**
 * Derives vote statistics from the current votes map.
 */
function computeStats(votes: Record<string, Card | null>) {
  const values = Object.values(votes).filter((v): v is Card => v !== null);
  const numeric = values
    .filter((v) => !NON_NUMERIC.has(v))
    .map((v) => parseFloat(v))
    .filter((n) => !isNaN(n));

  const average =
    numeric.length > 0
      ? Math.round((numeric.reduce((a, b) => a + b, 0) / numeric.length) * 10) / 10
      : null;

  const min = numeric.length > 0 ? Math.min(...numeric) : null;
  const max = numeric.length > 0 ? Math.max(...numeric) : null;
  const spread = min !== null && max !== null ? max - min : null;

  const agreement =
    spread === null ? "🤷" : spread === 0 ? "😄" : spread <= 3 ? "🤔" : "😬";

  // Vote distribution: card value → count, sorted numerically then alphabetically
  const distribution: Record<string, number> = {};
  for (const v of values) {
    distribution[v] = (distribution[v] ?? 0) + 1;
  }

  const sortedEntries = Object.entries(distribution).sort(([a], [b]) => {
    const na = parseFloat(a);
    const nb = parseFloat(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  });

  const maxCount = Math.max(...Object.values(distribution), 1);

  return { average, agreement, sortedEntries, maxCount, totalVotes: values.length };
}

/**
 * Displays voting statistics after cards are revealed.
 * Shows vertical vote bars on the left and average/agreement on the right.
 */
export function Stats({ votes, showAverage = true }: StatsProps) {
  const { average, agreement, sortedEntries, maxCount, totalVotes } =
    computeStats(votes);

  return (
    <StatsLayout>
      <BarsSection>
        {sortedEntries.map(([card, count]) => (
          <VoteBarWrapper key={card}>
            <BarTrack>
              <BarFill fillPct={(count / maxCount) * 100} />
            </BarTrack>
            <CardLabel>{card}</CardLabel>
            <VoteLabel>
              {count} {count === 1 ? "Vote" : "Votes"}
            </VoteLabel>
          </VoteBarWrapper>
        ))}
      </BarsSection>

      <Divider />

      <SidePanel>
        {showAverage && average !== null && (
          <SideBlock>
            <SideLabel>Average:</SideLabel>
            <AverageValue>{average.toLocaleString("de-DE")}</AverageValue>
          </SideBlock>
        )}
        <SideBlock>
          <SideLabel>Agreement:</SideLabel>
          <AgreementBadge>{agreement}</AgreementBadge>
        </SideBlock>
        <TotalVotes>
          {totalVotes} {totalVotes === 1 ? "Vote" : "Votes"} total
        </TotalVotes>
      </SidePanel>
    </StatsLayout>
  );
}

const StatsLayout = styled.div`
  display: flex;
  align-items: flex-end;
  gap: ${({ theme }) => theme.spacing.md};
  width: 100%;
  justify-content: center;
`;

const BarsSection = styled.div`
  display: flex;
  align-items: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const VoteBarWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

const BarTrack = styled.div`
  width: 40px;
  height: 80px;
  background: ${({ theme }) => theme.colors.card};
  border-radius: ${({ theme }) => theme.radii.sm};
  overflow: hidden;
  display: flex;
  align-items: flex-end;
`;

const BarFill = styled.div<{ fillPct: number }>`
  width: 100%;
  height: ${({ fillPct }) => fillPct}%;
  background: ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radii.sm};
  transition: height 400ms ease;
`;

const CardLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const VoteLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  white-space: nowrap;
`;

const Divider = styled.div`
  width: 1px;
  height: 100px;
  background: ${({ theme }) => theme.colors.card};
  align-self: center;
  flex-shrink: 0;
`;

const SidePanel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.xs};
  padding-left: ${({ theme }) => theme.spacing.sm};
`;

const SideBlock = styled.div`
  display: flex;
  flex-direction: column;
`;

const SideLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const AverageValue = styled.span`
  font-size: 32px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: 1.1;
`;

const AgreementBadge = styled.div`
  font-size: 28px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radii.full};
  border: 2px solid ${({ theme }) => theme.colors.card};
`;

const TotalVotes = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;
