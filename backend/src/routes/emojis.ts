import type { Request, Response } from "express";
import rawGroups from "unicode-emoji-json/data-by-group.json";

export interface EmojiItem {
  emoji: string;
  name: string;
}

export interface EmojiGroup {
  label: string;
  emojis: EmojiItem[];
}

/**
 * Pre-built emoji groups, computed once on startup.
 * Skin-tone variants and Flags are excluded to keep the picker manageable.
 */
const EMOJI_GROUPS: EmojiGroup[] = (rawGroups as { name: string; emojis: { emoji: string; name: string; skin_tone_support: boolean }[] }[])
  .filter((g) => g.name !== "Flags")
  .map((g) => ({
    label: g.name,
    emojis: g.emojis
      .filter((e) => !e.skin_tone_support)
      .map((e) => ({ emoji: e.emoji, name: e.name })),
  }));

/**
 * GET /api/emojis
 * Returns all emoji groups (excluding Flags and skin-tone variants).
 * Consumed by the frontend emoji picker.
 */
export function getEmojis(_req: Request, res: Response): void {
  res.json({ groups: EMOJI_GROUPS });
}
