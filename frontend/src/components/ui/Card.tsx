import styled from "@emotion/styled";
import type { AppTheme } from "../../styles/theme";

/**
 * Surface container with rounded corners and a subtle shadow.
 * Use for panels, dialogs, and content groups.
 */
export const Card = styled.div`
  background-color: ${({ theme }) => (theme as AppTheme).colors.surface};
  border-radius: ${({ theme }) => (theme as AppTheme).radii.lg};
  padding: ${({ theme }) => (theme as AppTheme).spacing.lg};
  box-shadow: ${({ theme }) => (theme as AppTheme).shadows.card};
`;
