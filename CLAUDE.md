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

- Node.js 24 LTS + Express 4
- TypeScript 5
- ws (WebSocket Server)
- In-Memory Store (kein DB)

### Shared (`/shared`)

- `types.ts` – gemeinsame TypeScript Interfaces für Frontend + Backend
- `constants.ts` – MAX_PLAYERS, MAX_ISSUES, etc.

---

## Projektstruktur

```text
planning-poker/
├── CLAUDE.md
├── shared/
│   └── src/
│       ├── types.ts             # alle gemeinsamen TS Interfaces + ClientMessage/ServerMessage
│       ├── constants.ts         # MAX_PLAYERS, MAX_ISSUES, etc.
│       └── index.ts             # Re-exports
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # Reusable styled components (Button, Card, Modal, …)
│   │   │   ├── Table/           # Spieltisch + Spieler-Positionierung
│   │   │   ├── CardDeck/        # Karten-Auswahl (unten)
│   │   │   ├── PlayerSeat/      # Avatar + Karte + Name + ReactionBar-Hover
│   │   │   ├── Header/          # Invite-Button (Timer/Avatar-Dropdown noch offen)
│   │   │   ├── Sidebar/         # Issues-Liste (noch nicht implementiert)
│   │   │   ├── Stats/           # Vertikale Balken + Average + Agreement nach Reveal
│   │   │   └── Reactions/       # ReactionBar.tsx (Hover-Bar + Picker) + Reactions.tsx (Animationen)
│   │   ├── store/
│   │   │   ├── roomSlice.ts
│   │   │   ├── playerSlice.ts
│   │   │   ├── reactionsSlice.ts
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts  # WS-Verbindung + Redux-Dispatch
│   │   │   └── useEmojiGroups.ts # Emoji-Daten vom Server (gecacht, einmaliger Fetch)
│   │   ├── screens/
│   │   │   ├── LobbyScreen.tsx
│   │   │   └── GameScreen.tsx
│   │   └── styles/
│   │       └── theme.ts         # Emotion Theme Tokens
│   └── vite.config.ts           # Vite + /api Proxy zu Backend (dev)
└── backend/
    └── src/
        ├── rooms/
        │   ├── roomStore.ts     # In-Memory Store (Map<roomId, Room>)
        │   └── roomManager.ts   # Business Logic
        ├── routes/
        │   └── emojis.ts        # GET /api/emojis – Emoji-Gruppen aus unicode-emoji-json
        ├── websocket/
        │   └── handler.ts       # WS Message Handler
        └── index.ts             # Express + WS Server
```

---

## Implementierungsstand

### ✅ Fertig

- Lobby (Name + Avatar wählen, Raum erstellen/joinen per Link)
- Spielphasen: waiting → voting → reveal → new round
- Karten-Deck (Fibonacci default, mehrere VotingSystems im Backend)
- Reveal-Statistiken: vertikale Stimmenbalken pro Karte, Average (schaltbar), Agreement-Emoji
- Emoji-Reaktionen: Hover-Bar über Spieler (CSS :hover), 4 Slots + Picker; schaltbar via `funFeatures`
- Emoji-Picker: Daten vom Backend (unicode-emoji-json), Name-Suche, Portal-Rendering
- Physik-Animation: Arc-Flug → Impact/Squash → Bounce → Fall
- **Room Settings** – vollständig implementiert (Lobby + In-Game):
  - `CREATE_ROOM` übergibt initial settings; Backend wendet sie atomar beim Erstellen an
  - Settings Modal (⚙️ im Header, nur für Facilitator): VotingSystem, whoCanReveal, autoReveal, showAverage, funFeatures
  - Lobby "Create room"-Tab: gleiche Settings vor Raumerstellung konfigurierbar
  - `UPDATE_SETTINGS` WS-Message + Backend-Handler für Änderungen im laufenden Spiel
- **Reveal-Button-Logik**: nur sichtbar wenn mind. 1 Karte gewählt; sichtbar gemäß `whoCanReveal`-Setting
- Auto-Reveal: Backend löst Reveal aus wenn alle Spieler abgestimmt haben und `autoReveal === true`

### ❌ Noch offen (Reihenfolge nach Priorität)

1. **Sidebar** – einklappbare Issues-Liste; `ADD_ISSUE` + `whoCanManageIssues` sind im Backend bereits implementiert
2. **Avatar Dropdown** – im Header: Name + Avatar ändern
3. **Timer** – im Header anzeigen; `timer`-Feld existiert auf `Room` im Backend; `showCountdown`-Setting ist vorbereitet aber hat noch keine UI
4. **Custom Deck** – UI für eigene Kartenwerte wenn `votingSystem === "custom"`
5. **React Component Tests** – Vitest für Komponenten (laut Coding-Konventionen gefordert)

### 🐛 Bekannte Bugs

Keine bekannten Bugs.

---

## Datenmodell (`shared/src/types.ts`)

```typescript
type GamePhase = "waiting" | "voting" | "reveal";

type VotingSystem = "fibonacci" | "modified-fibonacci" | "tshirts" | "powers-of-2" | "custom";

type Card = string; // z.B. "0","1","½","XS","S","M","L","XL","?","☕"

const VOTING_SYSTEMS: Record<VotingSystem, Card[]> = {
  "fibonacci":          ["0","1","2","3","5","8","13","21","34","55","89","?","☕"],
  "modified-fibonacci": ["0","½","1","2","3","5","8","13","20","40","100","?","☕"],
  "tshirts":            ["XS","S","M","L","XL","?","☕"],
  "powers-of-2":        ["0","1","2","4","8","16","32","64","?","☕"],
  "custom":             [],
};

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

interface RoomSettings {
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

interface Room {
  id: string;
  hostId: string;
  phase: GamePhase;
  players: Player[];
  currentVotes: Record<string, Card | null>; // playerId → Card
  timer: number;
  issues: Issue[];
  settings: RoomSettings;
}
```

---

## WebSocket-Protokoll

### Client → Server

```typescript
type ClientMessage =
  | { type: "CREATE_ROOM"; playerName: string; avatar: AvatarConfig }
  | { type: "JOIN_ROOM"; roomId: string; playerName: string; avatar: AvatarConfig }
  | { type: "VOTE"; card: Card }
  | { type: "REVEAL_CARDS" }
  | { type: "NEW_VOTING" }
  | { type: "SEND_REACTION"; emoji: string; targetPlayerId: string }
  | { type: "ADD_ISSUE"; title: string }
  | { type: "UPDATE_SETTINGS"; settings: Partial<RoomSettings> };
```

### Server → Client

```typescript
type ServerMessage =
  | { type: "ROOM_CREATED"; roomId: string; playerId: string }
  | { type: "ROOM_UPDATED"; room: Room }
  | { type: "PLAYER_JOINED"; player: Player }
  | { type: "CARDS_REVEALED"; votes: Record<string, Card> }
  | { type: "REACTION"; playerId: string; emoji: string; targetPlayerId: string }
  | { type: "ERROR"; message: string };
```

---

## Fachliche Anforderungen

### Rollen

- **Host:** Erstellt Raum, gibt Namen ein, wählt Avatar aus, startet/beendet Voting, startet neue Runde, wählt Karte
- **Spieler:** Joint per Invite-Link, gibt Namen ein, wählt Avatar aus, wählt Karte

### Spielphasen

1. **waiting** – Spieler joinen, Host wartet
2. **voting** – Alle wählen verdeckt eine Karte; Panel zeigt "Pick your cards!"
3. **reveal** – Alle Karten aufgedeckt; Statistiken sichtbar; Host kann "Start new voting"

### Statistiken (nach Reveal)

- Vertikale Balken pro Kartenwert (Höhe = proportionale Stimmenzahl)
- Average (Durchschnitt numerischer Votes)
- Anzahl Votes gesamt
- Agreement-Emoji (😄 = alle gleich, 🤔 = Spread ≤ 3, 😬 = großer Spread)

### UI-Bereiche

- **Header:** Invite-Button (Timer + Avatar-Dropdown noch offen)
- **Spielfeld:** Spieler rund um virtuellen Tisch, zentrales Status-Panel
- **Karten-Auswahl:** Karten unten, auswählbar
- **Sidebar:** Issues-Liste, einklappbar (noch nicht implementiert)
- **Reaktionen:** Emoji-Bar erscheint beim Hover über andere Spieler; Emoji fliegt zum Ziel mit Physik-Animation

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
    surface: "#1E1B2E",    // Weiches Lila-Dunkel
    card: "#2D2640",       // Midnight Purple
    primary: "#7C3AED",    // Lebendiges Violett
    accent: "#06D6A0",     // Cyan / Mint
    warning: "#FF6B35",    // Warm Orange
    textPrimary: "#FFFFFE", // Warm White
    textSecondary: "#A9A4C0" // Lavender
  }
};
```

### Styling-Regeln

- Kein CSS-Dateien – ausschließlich **Emotion styled components**
- Theme-Tokens immer über `useTheme()` konsumieren, keine Hardcoded Farben
- Wiederverwendbare styled components in `frontend/src/components/ui/` – z.B. Button, Card, Badge, Modal

---

## Coding-Konventionen

- **Code language: English** – all variables, functions, comments, and JSDoc in English
- Alle Komponenten als **funktionale React Components**
- Props immer mit TypeScript Interface typisiert
- Redux Toolkit `createSlice` für alle Slices
- WebSocket-Logik ausschließlich in `useWebSocket.ts` Hook
- Keine direkten WebSocket-Calls in Komponenten
- Tests in Vitest für Business Logic (roomManager, roomStore) **und** React-Komponenten

### Error Handling

- Validierung an WS-Boundaries (eingehende Client-Messages) und bei User-Input
- Server antwortet mit `{ type: "ERROR"; message: string }` bei ungültigen Messages
- Kein defensives Over-Engineering in interner Business Logic

### Kommentare

- **JSDoc auf allen public Interfaces und exportierten Funktionen** (Parameter, Return, Zweck)
- Inline-Kommentare nur bei nicht-offensichtlicher Logik (Warum, nicht Was)
- Keine Kommentare für selbsterklärenden Code

### Komponenten-Größe

- Eine Komponente = eine Verantwortlichkeit
- Bei mehr als einer Verantwortlichkeit → aufteilen, unabhängig von Zeilenanzahl

### Konstanten

- Alle Magic Numbers und Konfigurationswerte in `shared/src/constants.ts`
- Beispiele: Timer-Dauer, maximale Spieleranzahl, maximale Issues pro Raum
