import { useState, useEffect } from "react";
import styled from "@emotion/styled";
import type { AvatarConfig } from "@planning-poker/shared";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setLocalIdentity } from "../store/playerSlice";
import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import type { ClientMessage } from "@planning-poker/shared";

const AVATAR_STYLES: AvatarConfig["style"][] = ["adventurer", "bottts", "pixel-art", "lorelei"];

interface LobbyScreenProps {
  send: (message: ClientMessage) => void;
}

/**
 * Entry screen where players set their name, choose an avatar, and create or join a room.
 * Reads `?room=ID` from the URL to pre-fill the join form when following an invite link.
 */
export function LobbyScreen({ send }: LobbyScreenProps) {
  const dispatch = useAppDispatch();
  const playerId = useAppSelector((state) => state.player.playerId);

  const urlRoomId = new URLSearchParams(window.location.search).get("room") ?? "";

  const [name, setName] = useState("");
  const [avatarStyle, setAvatarStyle] = useState<AvatarConfig["style"]>("bottts");
  const [avatarSeed] = useState(() => Math.random().toString(36).slice(2, 10));
  const [mode, setMode] = useState<"create" | "join">(urlRoomId ? "join" : "create");
  const [roomId, setRoomId] = useState(urlRoomId);
  const [error, setError] = useState("");

  const avatar: AvatarConfig = { style: avatarStyle, seed: avatarSeed };

  // Once the server sends ROOM_CREATED the playerId lands in Redux;
  // save the full identity here where we have name + avatar.
  useEffect(() => {
    if (playerId) {
      dispatch(setLocalIdentity({ playerName: name, avatar }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId]);

  const handleCreate = () => {
    if (!name.trim()) { setError("Please enter your name."); return; }
    setError("");
    send({ type: "CREATE_ROOM", playerName: name.trim(), avatar });
  };

  const handleJoin = () => {
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!roomId.trim()) { setError("Please enter a room ID."); return; }
    setError("");
    send({ type: "JOIN_ROOM", roomId: roomId.trim().toUpperCase(), playerName: name.trim(), avatar });
  };

  return (
    <Page>
      <LobbyCard>
        <Title>🃏 Planning Poker</Title>
        <Subtitle>Estimate together, build better.</Subtitle>

        <Section>
          <Label>Your name</Label>
          <Input
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (mode === "create" ? handleCreate() : handleJoin())}
            maxLength={30}
            autoFocus
          />
        </Section>

        <Section>
          <Label>Your avatar</Label>
          <AvatarGrid>
            {AVATAR_STYLES.map((style) => (
              <AvatarOption
                key={style}
                selected={style === avatarStyle}
                onClick={() => setAvatarStyle(style)}
              >
                <Avatar config={{ style, seed: avatarSeed }} size={48} />
                <AvatarStyleName>{style}</AvatarStyleName>
              </AvatarOption>
            ))}
          </AvatarGrid>
        </Section>

        <Tabs>
          <Tab active={mode === "create"} onClick={() => setMode("create")}>Create room</Tab>
          <Tab active={mode === "join"} onClick={() => setMode("join")}>Join room</Tab>
        </Tabs>

        {mode === "join" && (
          <Section>
            <Label>Room ID</Label>
            <Input
              placeholder="e.g. ABC12345"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              maxLength={8}
            />
          </Section>
        )}

        {error && <ErrorText>{error}</ErrorText>}

        <Button
          onClick={mode === "create" ? handleCreate : handleJoin}
          size="lg"
          style={{ width: "100%", marginTop: 8 }}
        >
          {mode === "create" ? "Create room" : "Join room"}
        </Button>
      </LobbyCard>
    </Page>
  );
}

const Page = styled.div`
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.lg};
`;

const LobbyCard = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.shadows.card};
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.xxl};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
  text-align: center;
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
  margin-top: -${({ theme }) => theme.spacing.md};
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const AvatarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${({ theme }) => theme.spacing.sm};
`;

const AvatarOption = styled.button<{ selected: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  border: 2px solid ${({ selected, theme }) => selected ? theme.colors.primary : "transparent"};
  background-color: ${({ selected, theme }) => selected ? `${theme.colors.primary}22` : theme.colors.card};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const AvatarStyleName = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: capitalize;
`;

const Tabs = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  background-color: ${({ theme }) => theme.colors.card};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 4px;
`;

const Tab = styled.button<{ active: boolean }>`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: calc(${({ theme }) => theme.radii.md} - 2px);
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: 600;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  background-color: ${({ active, theme }) => active ? theme.colors.primary : "transparent"};
  color: ${({ active, theme }) => active ? theme.colors.textPrimary : theme.colors.textSecondary};

  &:hover:not([data-active="true"]) {
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`;

const ErrorText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.warning};
  text-align: center;
`;
