import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { removeReaction, type ActiveReaction } from "../../store/reactionsSlice";

const ANIMATION_DURATION_MS = 1300;

/**
 * Renders emoji reactions that fly from one side of the screen toward
 * the target player's seat. Each reaction is removed from Redux once the
 * animation finishes.
 */
export function Reactions() {
  const active = useAppSelector((state) => state.reactions.active);

  return (
    <>
      {active.map((reaction) => (
        <FlyingEmoji key={reaction.id} reaction={reaction} />
      ))}
    </>
  );
}

interface FlyingEmojiProps {
  reaction: ActiveReaction;
}

function FlyingEmoji({ reaction }: FlyingEmojiProps) {
  const dispatch = useAppDispatch();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Find the target player's DOM node by the data attribute set on PlayerSeat
    const target = document.querySelector<HTMLElement>(
      `[data-player-id="${reaction.targetPlayerId}"]`
    );
    const targetRect = target?.getBoundingClientRect();

    const endX = targetRect
      ? targetRect.left + targetRect.width / 2
      : window.innerWidth / 2;
    const endY = targetRect
      ? targetRect.top + targetRect.height / 2
      : window.innerHeight / 2;

    // Come from the opposite side to the target
    const fromLeft = endX > window.innerWidth / 2;
    const startX = fromLeft ? -60 : window.innerWidth + 60;
    const startY = endY + (Math.random() - 0.5) * 80;

    el.style.left = `${startX}px`;
    el.style.top = `${startY}px`;
    el.style.visibility = "visible";

    const dx = endX - startX;
    const dy = endY - startY;
    // Arc: lift upward in the middle of the trajectory
    const arcY = -Math.abs(dx) * 0.25;

    // Slight horizontal drift when falling after impact
    const drift = (Math.random() - 0.5) * 50;
    const spinDir = fromLeft ? 1 : -1;

    const anim = el.animate(
      [
        // ── Phase 1: arc flight toward target ──────────────────────────────
        {
          offset: 0,
          transform: "translate(0px, 0px) rotate(0deg) scale(1.3)",
          opacity: 1,
          easing: "ease-in",
        },
        {
          offset: 0.4,
          transform: `translate(${dx * 0.5}px, ${dy * 0.5 + arcY}px) rotate(${spinDir * -15}deg) scale(1.5)`,
          opacity: 1,
          easing: "ease-in",
        },
        // ── Phase 2: impact – burst then squash ────────────────────────────
        {
          offset: 0.52,
          transform: `translate(${dx}px, ${dy}px) rotate(0deg) scale(1.7)`,
          opacity: 1,
          easing: "ease-out",
        },
        {
          offset: 0.60,
          transform: `translate(${dx}px, ${dy + 10}px) scale(1.3, 0.6)`,
          opacity: 1,
          easing: "ease-out",
        },
        // ── Phase 3: bounce up ─────────────────────────────────────────────
        {
          offset: 0.70,
          transform: `translate(${dx + drift * 0.3}px, ${dy - 28}px) scale(1.0) rotate(${spinDir * 20}deg)`,
          opacity: 0.95,
          easing: "ease-in",
        },
        // ── Phase 4: fall down and fade ────────────────────────────────────
        {
          offset: 0.85,
          transform: `translate(${dx + drift * 0.7}px, ${dy + 40}px) scale(0.85) rotate(${spinDir * 38}deg)`,
          opacity: 0.65,
          easing: "ease-in",
        },
        {
          offset: 1.0,
          transform: `translate(${dx + drift}px, ${dy + 100}px) scale(0.5) rotate(${spinDir * 55}deg)`,
          opacity: 0,
        },
      ],
      { duration: ANIMATION_DURATION_MS, fill: "forwards" }
    );

    anim.onfinish = () => dispatch(removeReaction(reaction.id));
    return () => anim.cancel();
  }, [dispatch, reaction.id, reaction.targetPlayerId]);

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        visibility: "hidden",
        fontSize: 32,
        lineHeight: 1,
        userSelect: "none",
        pointerEvents: "none",
        zIndex: 999,
      }}
    >
      {reaction.emoji}
    </div>
  );
}
