export type GamePhase = "waiting" | "voting" | "reveal";

export type VotingSystem =
  | "fibonacci"
  | "modified-fibonacci"
  | "tshirts"
  | "powers-of-2"
  | "custom";

export type Card = string;

export const VOTING_SYSTEMS: Record<VotingSystem, Card[]> = {
  fibonacci: ["0", "1", "2", "3", "5", "8", "13", "21", "34", "55", "89", "?", "☕"],
  "modified-fibonacci": ["0", "½", "1", "2", "3", "5", "8", "13", "20", "40", "100", "?", "☕"],
  tshirts: ["XS", "S", "M", "L", "XL", "?", "☕"],
  "powers-of-2": ["0", "1", "2", "4", "8", "16", "32", "64", "?", "☕"],
  custom: [],
};

export interface AvatarConfig {
  style: "adventurer" | "bottts" | "pixel-art" | "lorelei";
  seed: string;
}

export interface Player {
  id: string;
  name: string;
  avatar: AvatarConfig;
  isHost: boolean;
  hasVoted: boolean;
}

export interface Issue {
  id: string;
  title: string;
  estimate?: string;
}

export interface RoomSettings {
  name?: string;
  facilitatorId: string;
  votingSystem: VotingSystem;
  customDeck?: Card[];
  whoCanReveal: "all" | "host";
  whoCanManageIssues: "all" | "host";
  autoReveal: boolean;
  funFeatures: boolean;
  showAverage: boolean;
  showCountdown: boolean;
}

export interface Room {
  id: string;
  hostId: string;
  phase: GamePhase;
  players: Player[];
  currentVotes: Record<string, Card | null>;
  timer: number;
  issues: Issue[];
  settings: RoomSettings;
}

export type ClientMessage =
  | { type: "CREATE_ROOM"; playerName: string }
  | { type: "JOIN_ROOM"; roomId: string; playerName: string }
  | { type: "VOTE"; card: Card }
  | { type: "REVEAL_CARDS" }
  | { type: "NEW_VOTING" }
  | { type: "SEND_REACTION"; emoji: string }
  | { type: "ADD_ISSUE"; title: string }
  | { type: "UPDATE_SETTINGS"; settings: Partial<RoomSettings> };

export type ServerMessage =
  | { type: "ROOM_CREATED"; roomId: string; playerId: string }
  | { type: "ROOM_UPDATED"; room: Room }
  | { type: "PLAYER_JOINED"; player: Player }
  | { type: "CARDS_REVEALED"; votes: Record<string, Card> }
  | { type: "REACTION"; playerId: string; emoji: string }
  | { type: "ERROR"; message: string };
