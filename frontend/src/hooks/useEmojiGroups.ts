import { useState, useEffect } from "react";

export interface EmojiItem {
  emoji: string;
  name: string;
}

export interface EmojiGroup {
  label: string;
  emojis: EmojiItem[];
}

// Module-level cache so we only fetch once per page load.
let cached: EmojiGroup[] | null = null;
let pending: Promise<EmojiGroup[]> | null = null;

async function fetchEmojiGroups(): Promise<EmojiGroup[]> {
  if (cached) return cached;
  if (!pending) {
    pending = fetch("/api/emojis")
      .then((r) => r.json() as Promise<{ groups: EmojiGroup[] }>)
      .then((data) => {
        cached = data.groups;
        return cached;
      });
  }
  return pending;
}

/**
 * Fetches emoji groups from the server once and caches them for the lifetime
 * of the page. Returns `null` while loading.
 */
export function useEmojiGroups(): EmojiGroup[] | null {
  const [groups, setGroups] = useState<EmojiGroup[] | null>(cached);

  useEffect(() => {
    if (cached) return;
    fetchEmojiGroups().then(setGroups);
  }, []);

  return groups;
}
