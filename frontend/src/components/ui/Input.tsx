import styled from "@emotion/styled";
import type { AppTheme } from "../../styles/theme";

/**
 * Reusable text input field, styled to match the app theme.
 */
export const Input = styled.input`
  width: 100%;
  padding: 10px ${({ theme }) => (theme as AppTheme).spacing.md};
  background-color: ${({ theme }) => (theme as AppTheme).colors.card};
  color: ${({ theme }) => (theme as AppTheme).colors.textPrimary};
  border: 1px solid transparent;
  border-radius: ${({ theme }) => (theme as AppTheme).radii.md};
  font-size: ${({ theme }) => (theme as AppTheme).fontSizes.md};
  transition: border-color ${({ theme }) => (theme as AppTheme).transitions.fast};
  outline: none;

  &::placeholder {
    color: ${({ theme }) => (theme as AppTheme).colors.textSecondary};
  }

  &:focus {
    border-color: ${({ theme }) => (theme as AppTheme).colors.primary};
  }
`;
