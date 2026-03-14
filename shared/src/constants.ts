/** Maximum number of players allowed in a single room. */
export const MAX_PLAYERS = 20;

/** Maximum number of issues per room. */
export const MAX_ISSUES = 100;

/** Default timer duration in seconds. */
export const DEFAULT_TIMER_SECONDS = 60;

/** Maximum length of a player name. */
export const MAX_PLAYER_NAME_LENGTH = 30;

/** Maximum length of a game name. */
export const MAX_GAME_NAME_LENGTH = 60;

/** Maximum length of an issue title. */
export const MAX_ISSUE_TITLE_LENGTH = 200;

/** Maximum number of cards in a custom deck. */
export const MAX_CUSTOM_DECK_SIZE = 20;

/** Maximum length of a single card label. */
export const MAX_CARD_LENGTH = 10;

/** Maximum avatar seed length. */
export const MAX_AVATAR_SEED_LENGTH = 64;

/** Maximum number of active rooms in memory. */
export const MAX_ROOMS = 500;

/** Room inactivity TTL in milliseconds (2 hours). */
export const ROOM_TTL_MS = 2 * 60 * 60 * 1000;

/** Maximum WebSocket messages per connection per minute before rate-limiting kicks in. */
export const WS_MAX_MESSAGES_PER_MINUTE = 60;
