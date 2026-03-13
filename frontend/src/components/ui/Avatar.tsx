import styled from "@emotion/styled";
import type { AvatarConfig } from "@planning-poker/shared";

interface AvatarProps {
  config: AvatarConfig;
  size?: number;
}

/**
 * Renders a DiceBear avatar as an inline SVG image.
 * @param config - Avatar style and seed.
 * @param size - Diameter in pixels (default 40).
 */
export function Avatar({ config, size = 40 }: AvatarProps) {
  const url = `https://api.dicebear.com/7.x/${config.style}/svg?seed=${encodeURIComponent(config.seed)}`;
  return <AvatarImage src={url} alt="avatar" size={size} />;
}

const AvatarImage = styled.img<{ size: number }>`
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.card};
  flex-shrink: 0;
`;
