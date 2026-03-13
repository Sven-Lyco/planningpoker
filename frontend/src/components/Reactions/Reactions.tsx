import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { removeReaction } from "../../store/reactionsSlice";

const ANIMATION_DURATION_MS = 2400;

/**
 * Renders animated emoji reactions that float upward and fade out over the table.
 * Each reaction is removed from Redux state once its animation completes.
 */
export function Reactions() {
  const dispatch = useAppDispatch();
  const active = useAppSelector((state) => state.reactions.active);

  return (
    <Overlay>
      {active.map((reaction) => (
        <FloatingEmoji
          key={reaction.id}
          xPercent={reaction.xPercent}
          onAnimationEnd={() => dispatch(removeReaction(reaction.id))}
        >
          {reaction.emoji}
        </FloatingEmoji>
      ))}
    </Overlay>
  );
}

const floatUp = keyframes`
  0%   { opacity: 1;   transform: translateY(0)     scale(1);   }
  60%  { opacity: 0.9; transform: translateY(-60px)  scale(1.3); }
  100% { opacity: 0;   transform: translateY(-130px) scale(0.9); }
`;

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
`;

const FloatingEmoji = styled.div<{ xPercent: number }>`
  position: absolute;
  bottom: 30%;
  left: ${({ xPercent }) => xPercent}%;
  font-size: 36px;
  line-height: 1;
  animation: ${floatUp} ${ANIMATION_DURATION_MS}ms ease-out forwards;
  user-select: none;
`;
