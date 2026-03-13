import styled from "@emotion/styled";
import type { ReactNode } from "react";
import type { AppTheme } from "../../styles/theme";

interface ModalProps {
  /** Whether the modal is visible. */
  isOpen: boolean;
  /** Called when the backdrop or close button is clicked. */
  onClose: () => void;
  children: ReactNode;
}

/**
 * Overlay modal dialog. Traps focus and closes on backdrop click.
 */
export function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <Backdrop onClick={onClose}>
      <ModalBox onClick={(e) => e.stopPropagation()}>{children}</ModalBox>
    </Backdrop>
  );
}

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`;

const ModalBox = styled.div`
  background-color: ${({ theme }) => (theme as AppTheme).colors.surface};
  border-radius: ${({ theme }) => (theme as AppTheme).radii.lg};
  padding: ${({ theme }) => (theme as AppTheme).spacing.xl};
  box-shadow: ${({ theme }) => (theme as AppTheme).shadows.card};
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
`;
