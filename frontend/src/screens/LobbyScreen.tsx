import { useState, useEffect } from "react";
import styled from "@emotion/styled";
import type { AvatarConfig, RoomSettings, VotingSystem } from "@planning-poker/shared";
import { VOTING_SYSTEMS } from "@planning-poker/shared";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setLocalIdentity } from "../store/playerSlice";
import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import type { ClientMessage } from "@planning-poker/shared";
import type { AppTheme } from "../styles/theme";

const AVATAR_STYLES: AvatarConfig["style"][] = ["adventurer", "bottts", "pixel-art", "lorelei"];

const VOTING_SYSTEM_LABELS: Record<VotingSystem, string> = {
  fibonacci: "Fibonacci",
  "modified-fibonacci": "Modified Fibonacci",
  tshirts: "T-Shirts",
  "powers-of-2": "Powers of 2",
  custom: "Custom",
};

const VOTING_SYSTEM_PREVIEW: Record<VotingSystem, string> = {
  fibonacci: "0, 1, 2, 3, 5, 8, 13…",
  "modified-fibonacci": "0, ½, 1, 2, 3, 5, 8…",
  tshirts: "XS, S, M, L, XL",
  "powers-of-2": "0, 1, 2, 4, 8, 16…",
  custom: "Define your own cards",
};

type InitialSettings = Pick<RoomSettings, "votingSystem" | "whoCanReveal" | "autoReveal" | "funFeatures" | "showAverage">;

const DEFAULT_INITIAL_SETTINGS: InitialSettings = {
  votingSystem: "fibonacci",
  whoCanReveal: "host",
  autoReveal: false,
  funFeatures: true,
  showAverage: true,
};

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
  const [settings, setSettings] = useState<InitialSettings>(DEFAULT_INITIAL_SETTINGS);

  const updateSetting = <K extends keyof InitialSettings>(key: K, value: InitialSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

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
    send({ type: "CREATE_ROOM", playerName: name.trim(), avatar, settings });
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

        {mode === "create" && (
          <>
            <Section>
              <Label>Voting system</Label>
              <VotingSystemGrid>
                {(Object.keys(VOTING_SYSTEMS) as VotingSystem[]).map((vs) => (
                  <VotingSystemOption
                    key={vs}
                    isSelected={settings.votingSystem === vs}
                    onClick={() => updateSetting("votingSystem", vs)}
                  >
                    <VSName>{VOTING_SYSTEM_LABELS[vs]}</VSName>
                    <VSPreview>{VOTING_SYSTEM_PREVIEW[vs]}</VSPreview>
                  </VotingSystemOption>
                ))}
              </VotingSystemGrid>
            </Section>

            <Section>
              <Label>Who can reveal cards</Label>
              <SegmentControl>
                <Segment
                  active={settings.whoCanReveal === "host"}
                  onClick={() => updateSetting("whoCanReveal", "host")}
                >
                  Host only
                </Segment>
                <Segment
                  active={settings.whoCanReveal === "all"}
                  onClick={() => updateSetting("whoCanReveal", "all")}
                >
                  Everyone
                </Segment>
              </SegmentControl>
            </Section>

            <Section>
              <Label>Features</Label>
              <ToggleList>
                <ToggleRow>
                  <ToggleLabelGroup>
                    <span>Auto-reveal</span>
                    <small>Reveal when all players voted</small>
                  </ToggleLabelGroup>
                  <ToggleTrack
                    checked={settings.autoReveal}
                    onClick={() => updateSetting("autoReveal", !settings.autoReveal)}
                  >
                    <ToggleThumb checked={settings.autoReveal} />
                  </ToggleTrack>
                </ToggleRow>
                <ToggleRow>
                  <ToggleLabelGroup>
                    <span>Show average</span>
                    <small>Display numeric average after reveal</small>
                  </ToggleLabelGroup>
                  <ToggleTrack
                    checked={settings.showAverage}
                    onClick={() => updateSetting("showAverage", !settings.showAverage)}
                  >
                    <ToggleThumb checked={settings.showAverage} />
                  </ToggleTrack>
                </ToggleRow>
                <ToggleRow>
                  <ToggleLabelGroup>
                    <span>Fun features</span>
                    <small>Emoji reactions between players</small>
                  </ToggleLabelGroup>
                  <ToggleTrack
                    checked={settings.funFeatures}
                    onClick={() => updateSetting("funFeatures", !settings.funFeatures)}
                  >
                    <ToggleThumb checked={settings.funFeatures} />
                  </ToggleTrack>
                </ToggleRow>
              </ToggleList>
            </Section>
          </>
        )}

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
  align-items: flex-start;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.lg};
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

const VotingSystemGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const VotingSystemOption = styled.button<{ isSelected: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 2px solid
    ${({ isSelected, theme }) => isSelected ? theme.colors.primary : theme.colors.card};
  background-color: ${({ isSelected, theme }) =>
    isSelected ? `${theme.colors.primary}22` : theme.colors.card};
  cursor: pointer;
  text-align: left;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const VSName = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const VSPreview = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const SegmentControl = styled.div`
  display: flex;
  background-color: ${({ theme }) => theme.colors.card};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 3px;
  gap: 3px;
`;

const Segment = styled.button<{ active: boolean }>`
  flex: 1;
  padding: 7px ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all ${({ theme }) => theme.transitions.fast};
  background-color: ${({ active, theme }) => active ? theme.colors.primary : "transparent"};
  color: ${({ active, theme }) =>
    active ? theme.colors.textPrimary : theme.colors.textSecondary};

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`;

const ToggleList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
`;

const ToggleLabelGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;

  span {
    font-size: ${({ theme }) => (theme as AppTheme).fontSizes.md};
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  small {
    font-size: ${({ theme }) => (theme as AppTheme).fontSizes.sm};
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const ToggleTrack = styled.div<{ checked: boolean }>`
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background-color: ${({ checked, theme }) =>
    checked ? theme.colors.primary : theme.colors.card};
  cursor: pointer;
  position: relative;
  flex-shrink: 0;
  transition: background-color ${({ theme }) => theme.transitions.fast};
`;

const ToggleThumb = styled.div<{ checked: boolean }>`
  position: absolute;
  top: 3px;
  left: ${({ checked }) => (checked ? "23px" : "3px")};
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: white;
  transition: left ${({ theme }) => theme.transitions.fast};
`;
