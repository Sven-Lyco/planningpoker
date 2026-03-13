import styled from "@emotion/styled";
import type { Card } from "@planning-poker/shared";

interface StatsProps {
  votes: Record<string, Card | null>;
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

  const average = numeric.length > 0
    ? Math.round((numeric.reduce((a, b) => a + b, 0) / numeric.length) * 10) / 10
    : null;

  const min = numeric.length > 0 ? Math.min(...numeric) : null;
  const max = numeric.length > 0 ? Math.max(...numeric) : null;
  const spread = min !== null && max !== null ? max - min : null;

  const agreement =
    spread === null ? "🤷" : spread === 0 ? "😄" : spread <= 3 ? "🤔" : "😬";

  // Vote distribution: card value → count
  const distribution: Record<string, number> = {};
  for (const v of values) {
    distribution[v] = (distribution[v] ?? 0) + 1;
  }

  return { average, agreement, distribution, totalVotes: values.length };
}

/**
 * Displays voting statistics after cards are revealed.
 */
export function Stats({ votes }: StatsProps) {
  const { average, agreement, distribution, totalVotes } = computeStats(votes);

  return (
    <StatsContainer>
      <AgreementEmoji>{agreement}</AgreementEmoji>
      {average !== null && (
        <AverageRow>
          <AverageLabel>Average</AverageLabel>
          <AverageValue>{average}</AverageValue>
        </AverageRow>
      )}
      <VoteCount>{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</VoteCount>
      <Distribution>
        {Object.entries(distribution)
          .sort(([a], [b]) => {
            const na = parseFloat(a);
            const nb = parseFloat(b);
            if (!isNaN(na) && !isNaN(nb)) return na - nb;
            return a.localeCompare(b);
          })
          .map(([card, count]) => (
            <DistributionItem key={card}>
              <DistributionCard>{card}</DistributionCard>
              <DistributionBar>
                <DistributionFill width={(count / totalVotes) * 100} />
              </DistributionBar>
              <DistributionCount>{count}</DistributionCount>
            </DistributionItem>
          ))}
      </Distribution>
    </StatsContainer>
  );
}

const StatsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
`;

const AgreementEmoji = styled.div`
  font-size: 32px;
  line-height: 1;
`;

const AverageRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const AverageLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const AverageValue = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xxl};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.accent};
`;

const VoteCount = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Distribution = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const DistributionItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const DistributionCard = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  width: 28px;
  text-align: right;
`;

const DistributionBar = styled.div`
  flex: 1;
  height: 8px;
  background-color: ${({ theme }) => theme.colors.card};
  border-radius: ${({ theme }) => theme.radii.full};
  overflow: hidden;
`;

const DistributionFill = styled.div<{ width: number }>`
  height: 100%;
  width: ${({ width }) => width}%;
  background-color: ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radii.full};
  transition: width ${({ theme }) => theme.transitions.normal};
`;

const DistributionCount = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  width: 16px;
`;
