import styled from "@emotion/styled";
/**
 * Reusable text input field, styled to match the app theme.
 */
export const Input = styled.input `
  width: 100%;
  padding: 10px ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.card};
  color: ${({ theme }) => theme.colors.textPrimary};
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.md};
  transition: border-color ${({ theme }) => theme.transitions.fast};
  outline: none;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;
