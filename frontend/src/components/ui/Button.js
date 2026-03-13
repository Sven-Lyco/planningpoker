import styled from "@emotion/styled";
/**
 * Reusable button component with primary, secondary, and ghost variants.
 */
export const Button = styled.button `
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-weight: 600;
  transition: all ${({ theme }) => theme.transitions.fast};

  /* Size */
  padding: ${({ size = "md" }) => size === "sm" ? "6px 12px" : size === "lg" ? "14px 28px" : "10px 20px"};
  font-size: ${({ size = "md", theme }) => size === "sm"
    ? theme.fontSizes.sm
    : size === "lg"
        ? theme.fontSizes.lg
        : theme.fontSizes.md};

  /* Variant */
  background-color: ${({ variant = "primary", theme }) => {
    const t = theme;
    if (variant === "primary")
        return t.colors.primary;
    if (variant === "secondary")
        return t.colors.surface;
    return "transparent";
}};
  color: ${({ variant = "primary", theme }) => {
    const t = theme;
    if (variant === "ghost")
        return t.colors.textSecondary;
    return t.colors.textPrimary;
}};
  border: ${({ variant = "primary", theme }) => {
    const t = theme;
    if (variant === "secondary")
        return `1px solid ${t.colors.card}`;
    if (variant === "ghost")
        return "1px solid transparent";
    return "none";
}};

  &:hover:not(:disabled) {
    opacity: 0.88;
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;
