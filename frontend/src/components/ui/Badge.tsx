import styled from "@emotion/styled";
import type { AppTheme } from "../../styles/theme";

type BadgeVariant = "default" | "accent" | "warning";

interface BadgeProps {
  variant?: BadgeVariant;
}

/**
 * Small inline label for status indicators, counts, or tags.
 */
export const Badge = styled.span<BadgeProps>`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: ${({ theme }) => (theme as AppTheme).radii.full};
  font-size: ${({ theme }) => (theme as AppTheme).fontSizes.sm};
  font-weight: 600;

  background-color: ${({ variant = "default", theme }) => {
    const t = theme as AppTheme;
    if (variant === "accent") return `${t.colors.accent}22`;
    if (variant === "warning") return `${t.colors.warning}22`;
    return t.colors.card;
  }};
  color: ${({ variant = "default", theme }) => {
    const t = theme as AppTheme;
    if (variant === "accent") return t.colors.accent;
    if (variant === "warning") return t.colors.warning;
    return t.colors.textSecondary;
  }};
`;
