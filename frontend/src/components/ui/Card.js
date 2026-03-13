import styled from "@emotion/styled";
/**
 * Surface container with rounded corners and a subtle shadow.
 * Use for panels, dialogs, and content groups.
 */
export const Card = styled.div `
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadows.card};
`;
