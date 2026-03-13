# Planning Poker App – Claude Code Context

## Projektübersicht

Planning Poker App für agile Teams. Echtzeit-Multiplayer über WebSockets.
Kein Datenbankzustand – alles In-Memory auf dem Server.

---

## Tech-Stack

### Frontend (`/frontend`)

- React 18, TypeScript 5
- Redux Toolkit (State Management)
- Emotion (CSS-in-JS, styled components)
- Vite (Build Tool / Dev Server)
- Vitest (Tests)

### Backend (`/backend`)

- Node.js 20 LTS + Express 4
- TypeScript 5
- ws (WebSocket Server)
- In-Memory Store (kein DB)

### Shared (`/shared`)

- `types.ts` – gemeinsame TypeScript Interfaces für Frontend + Backend

---

## Projektstruktur

```
planning-poker/
├── CLAUDE.md
├── shared/
│   └── types.ts
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Table/           # Spieltisch + Spieler-Positionierung
│   │   │   ├── CardDeck/        # Karten-Auswahl (unten)
│   │   │   ├── PlayerSeat/      # Avatar + Karte + Name
│   │   │   ├── Header/          # Timer, Avatar-Dropdown, Invite-Button
│   │   │   ├── Sidebar/         # Issues-Liste
│   │   │   ├── Stats/           # Average, Agreement nach Reveal
│   │   │   └── Reactions/       # Emoji-Reaktionen animiert
│   │   ├── store/
│   │   │   ├── roomSlice.ts
│   │   │   ├── playerSlice.ts
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── styles/
│   │       └── theme.ts         # Emotion Theme Tokens
│   └── vite.config.ts
└── backend/
    └── src/
        ├── rooms/
        │   ├── roomStore.ts     # In-Memory Store (Map<roomId, Room>)
        │   └── roomManager.ts   # Business Logic
        ├── websocket/
        │   └── handler.ts       # WS Message Handler
        └── index.ts             # Express + WS Server
```

---

## Datenmodell (`shared/types.ts`)

```typescript
type GamePhase = "waiting" | "voting" | "reveal";

type Card = "0" | "1" | "2" | "3" | "5" | "8" | "13" | "21" | "34" | "55" | "89" | "?" | "☕";

interface AvatarConfig {
  style: "adventurer" | "bottts" | "pixel-art" | "lorelei";
  seed: string;
}

interface Player {
  id: string;
  name: string;
  avatar: AvatarConfig;
  isHost: boolean;
  hasVoted: boolean;
}

interface Issue {
  id: string;
  title: string;
  estimate?: string;
}

interface Room {
  id: string;
  hostId: string;
  phase: GamePhase;
  players: Player[];
  currentVotes: Record<string, Card | null>; // playerId → Card
  timer: number;
  issues: Issue[];
}
```

---

## WebSocket-Protokoll

### Client → Server

```typescript
type ClientMessage =
  | { type: "CREATE_ROOM"; playerName: string }
  | { type: "JOIN_ROOM"; roomId: string; playerName: string }
  | { type: "VOTE"; card: Card }
  | { type: "REVEAL_CARDS" } // nur Host
  | { type: "NEW_VOTING" } // nur Host
  | { type: "SEND_REACTION"; emoji: string }
  | { type: "ADD_ISSUE"; title: string };
```

### Server → Client

```typescript
type ServerMessage =
  | { type: "ROOM_CREATED"; roomId: string; playerId: string }
  | { type: "ROOM_UPDATED"; room: Room }
  | { type: "PLAYER_JOINED"; player: Player }
  | { type: "CARDS_REVEALED"; votes: Record<string, Card> }
  | { type: "REACTION"; playerId: string; emoji: string }
  | { type: "ERROR"; message: string };
```

---

## Fachliche Anforderungen

### Rollen

- **Host:** Erstellt Raum, gibt Namen ein, wählt Avatar aus, startet/beendet Voting, startet neue Runde, wählt Karte
- **Spieler:** Joint per Invite-Link, gibt Namen ein, wählt Avatar aus,wählt Karte

### Spielphasen

1. **waiting** – Spieler joinen, Host wartet
2. **voting** – Alle wählen verdeckt eine Karte; Panel zeigt "Pick your cards!"
3. **reveal** – Alle Karten aufgedeckt; Statistiken sichtbar; Host kann "Start new voting"

### Karten-Deck

`0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, ?, ☕`

### Statistiken (nach Reveal)

- Average (Durchschnitt numerischer Votes)
- Anzahl Votes
- Agreement-Emoji (😄 = alle gleich, 😬 = sehr unterschiedlich)

### UI-Bereiche

- **Header:** Timer, eigener Avatar + Dropdown, "Invite players" Button, Sidebar-Toggle
- **Spielfeld:** Spieler rund um virtuellen Tisch (oben/unten/links/rechts), zentrales Status-Panel
- **Karten-Auswahl:** Fibonacci-Karten unten, auswählbar
- **Sidebar:** Issues-Liste, einklappbar
- **Reaktionen:** Emoji-Reaktionen, animiert über Tisch fliegend

### Avatare

- Service: DiceBear API – `https://api.dicebear.com/7.x/{style}/svg?seed={seed}`
- Seed: zufällig generiert beim Beitreten
- Styles: `adventurer`, `bottts`, `pixel-art`, `lorelei`

---

## Design / Theme

### Farbpalette (Emotion Theme)

```typescript
const theme = {
  colors: {
    background: "#0F0E17", // Tiefes Indigo
    surface: "#1E1B2E", // Weiches Lila-Dunkel
    card: "#2D2640", // Midnight Purple
    primary: "#7C3AED", // Lebendiges Violett
    accent: "#06D6A0", // Cyan / Mint
    warning: "#FF6B35", // Warm Orange
    textPrimary: "#FFFFFE", // Warm White
    textSecondary: "#A9A4C0" // Lavender
  }
};
```

### Styling-Regeln

- Kein CSS-Dateien – ausschließlich **Emotion styled components**
- Theme-Tokens immer über `useTheme()` konsumieren, keine Hardcoded Farben

---

## Coding-Konventionen

- Alle Komponenten als **funktionale React Components**
- Props immer mit TypeScript Interface typisiert
- Redux Toolkit `createSlice` für alle Slices
- WebSocket-Logik ausschließlich in `useWebSocket.ts` Hook
- Keine direkten WebSocket-Calls in Komponenten
- Tests in Vitest für Business Logic (roomManager, roomStore)
