import { useState } from "react";
import styled from "@emotion/styled";
import type { RoomSettings, VotingSystem } from "@planning-poker/shared";
import { VOTING_SYSTEMS } from "@planning-poker/shared";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import type { AppTheme } from "../../styles/theme";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with only the changed fields when the user saves. */
  onSave: (settings: Partial<RoomSettings>) => void;
  currentSettings: RoomSettings;
}

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

interface ToggleProps {
  checked: boolean;
  onChange: (val: boolean) => void;
}

function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <ToggleTrack checked={checked} onClick={() => onChange(!checked)}>
      <ToggleThumb checked={checked} />
    </ToggleTrack>
  );
}

/**
 * Settings modal for room configuration. Only the facilitator should open this.
 * Sends only changed fields via onSave.
 */
export function SettingsModal({ isOpen, onClose, onSave, currentSettings }: SettingsModalProps) {
  const [draft, setDraft] = useState<Partial<RoomSettings>>({});

  const effective = { ...currentSettings, ...draft };

  const update = <K extends keyof RoomSettings>(key: K, value: RoomSettings[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (Object.keys(draft).length > 0) {
      onSave(draft);
    }
    setDraft({});
    onClose();
  };

  const handleClose = () => {
    setDraft({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <Title>Room Settings</Title>

      <Section>
        <SectionLabel>Room name</SectionLabel>
        <Input
          value={effective.name ?? ""}
          onChange={(e) => update("name", e.target.value)}
          placeholder="My Planning Poker Room"
        />
      </Section>

      <Section>
        <SectionLabel>Voting system</SectionLabel>
        <VotingSystemGrid>
          {(Object.keys(VOTING_SYSTEMS) as VotingSystem[]).map((vs) => (
            <VotingSystemOption
              key={vs}
              isSelected={effective.votingSystem === vs}
              onClick={() => update("votingSystem", vs)}
            >
              <VSName>{VOTING_SYSTEM_LABELS[vs]}</VSName>
              <VSPreview>{VOTING_SYSTEM_PREVIEW[vs]}</VSPreview>
            </VotingSystemOption>
          ))}
        </VotingSystemGrid>
      </Section>

      <Section>
        <SectionLabel>Who can reveal cards</SectionLabel>
        <SegmentControl>
          <Segment
            active={effective.whoCanReveal === "all"}
            onClick={() => update("whoCanReveal", "all")}
          >
            Everyone
          </Segment>
          <Segment
            active={effective.whoCanReveal === "host"}
            onClick={() => update("whoCanReveal", "host")}
          >
            Host only
          </Segment>
        </SegmentControl>
      </Section>

      <Section>
        <SectionLabel>Features</SectionLabel>
        <ToggleList>
          <ToggleRow>
            <ToggleLabelGroup>
              <span>Auto-reveal</span>
              <small>Reveal automatically when all players have voted</small>
            </ToggleLabelGroup>
            <Toggle
              checked={effective.autoReveal}
              onChange={(val) => update("autoReveal", val)}
            />
          </ToggleRow>
          <ToggleRow>
            <ToggleLabelGroup>
              <span>Show average</span>
              <small>Display numeric average after reveal</small>
            </ToggleLabelGroup>
            <Toggle
              checked={effective.showAverage}
              onChange={(val) => update("showAverage", val)}
            />
          </ToggleRow>
          <ToggleRow>
            <ToggleLabelGroup>
              <span>Fun features</span>
              <small>Emoji reactions between players</small>
            </ToggleLabelGroup>
            <Toggle
              checked={effective.funFeatures}
              onChange={(val) => update("funFeatures", val)}
            />
          </ToggleRow>
        </ToggleList>
      </Section>

      <Footer>
        <Button variant="ghost" size="sm" onClick={handleClose}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave}>
          Save settings
        </Button>
      </Footer>
    </Modal>
  );
}

const Title = styled.h2`
  font-size: ${({ theme }) => (theme as AppTheme).fontSizes.xl};
  font-weight: 700;
  color: ${({ theme }) => (theme as AppTheme).colors.textPrimary};
  margin-bottom: ${({ theme }) => (theme as AppTheme).spacing.lg};
`;

const Section = styled.div`
  margin-bottom: ${({ theme }) => (theme as AppTheme).spacing.lg};
`;

const SectionLabel = styled.p`
  font-size: ${({ theme }) => (theme as AppTheme).fontSizes.sm};
  font-weight: 600;
  color: ${({ theme }) => (theme as AppTheme).colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: ${({ theme }) => (theme as AppTheme).spacing.sm};
`;

const VotingSystemGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => (theme as AppTheme).spacing.sm};
`;

const VotingSystemOption = styled.button<{ isSelected: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: ${({ theme }) => (theme as AppTheme).spacing.sm}
    ${({ theme }) => (theme as AppTheme).spacing.md};
  border-radius: ${({ theme }) => (theme as AppTheme).radii.md};
  border: 2px solid
    ${({ isSelected, theme }) =>
      isSelected ? (theme as AppTheme).colors.primary : (theme as AppTheme).colors.card};
  background-color: ${({ isSelected, theme }) =>
    isSelected
      ? `${(theme as AppTheme).colors.primary}22`
      : (theme as AppTheme).colors.card};
  cursor: pointer;
  text-align: left;
  transition: all ${({ theme }) => (theme as AppTheme).transitions.fast};

  &:hover {
    border-color: ${({ theme }) => (theme as AppTheme).colors.primary};
  }
`;

const VSName = styled.span`
  font-size: ${({ theme }) => (theme as AppTheme).fontSizes.sm};
  font-weight: 600;
  color: ${({ theme }) => (theme as AppTheme).colors.textPrimary};
`;

const VSPreview = styled.span`
  font-size: ${({ theme }) => (theme as AppTheme).fontSizes.sm};
  color: ${({ theme }) => (theme as AppTheme).colors.textSecondary};
`;

const SegmentControl = styled.div`
  display: flex;
  background-color: ${({ theme }) => (theme as AppTheme).colors.card};
  border-radius: ${({ theme }) => (theme as AppTheme).radii.md};
  padding: 3px;
  gap: 3px;
`;

const Segment = styled.button<{ active: boolean }>`
  flex: 1;
  padding: 7px ${({ theme }) => (theme as AppTheme).spacing.md};
  border-radius: ${({ theme }) => (theme as AppTheme).radii.sm};
  font-size: ${({ theme }) => (theme as AppTheme).fontSizes.sm};
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all ${({ theme }) => (theme as AppTheme).transitions.fast};

  background-color: ${({ active, theme }) =>
    active ? (theme as AppTheme).colors.primary : "transparent"};
  color: ${({ active, theme }) =>
    active
      ? (theme as AppTheme).colors.textPrimary
      : (theme as AppTheme).colors.textSecondary};

  &:hover {
    color: ${({ theme }) => (theme as AppTheme).colors.textPrimary};
  }
`;

const ToggleList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => (theme as AppTheme).spacing.md};
`;

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => (theme as AppTheme).spacing.md};
`;

const ToggleLabelGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;

  span {
    font-size: ${({ theme }) => (theme as AppTheme).fontSizes.md};
    color: ${({ theme }) => (theme as AppTheme).colors.textPrimary};
  }

  small {
    font-size: ${({ theme }) => (theme as AppTheme).fontSizes.sm};
    color: ${({ theme }) => (theme as AppTheme).colors.textSecondary};
  }
`;

const ToggleTrack = styled.div<{ checked: boolean }>`
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background-color: ${({ checked, theme }) =>
    checked ? (theme as AppTheme).colors.primary : (theme as AppTheme).colors.card};
  cursor: pointer;
  position: relative;
  flex-shrink: 0;
  transition: background-color ${({ theme }) => (theme as AppTheme).transitions.fast};
`;

const ToggleThumb = styled.div<{ checked: boolean }>`
  position: absolute;
  top: 3px;
  left: ${({ checked }) => (checked ? "23px" : "3px")};
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: white;
  transition: left ${({ theme }) => (theme as AppTheme).transitions.fast};
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => (theme as AppTheme).spacing.sm};
  margin-top: ${({ theme }) => (theme as AppTheme).spacing.lg};
  padding-top: ${({ theme }) => (theme as AppTheme).spacing.lg};
  border-top: 1px solid ${({ theme }) => (theme as AppTheme).colors.card};
`;
