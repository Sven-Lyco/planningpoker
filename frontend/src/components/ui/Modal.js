import { jsx as _jsx } from "@emotion/react/jsx-runtime";
import styled from "@emotion/styled";
/**
 * Overlay modal dialog. Traps focus and closes on backdrop click.
 */
export function Modal({ isOpen, onClose, children }) {
    if (!isOpen)
        return null;
    return (_jsx(Backdrop, { onClick: onClose, children: _jsx(ModalBox, { onClick: (e) => e.stopPropagation(), children: children }) }));
}
const Backdrop = styled.div `
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`;
const ModalBox = styled.div `
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.shadows.card};
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
`;
