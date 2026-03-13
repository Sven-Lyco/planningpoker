import { jsx as _jsx } from "@emotion/react/jsx-runtime";
import styled from "@emotion/styled";
/**
 * Renders a DiceBear avatar as an inline SVG image.
 * @param config - Avatar style and seed.
 * @param size - Diameter in pixels (default 40).
 */
export function Avatar({ config, size = 40 }) {
    const url = `https://api.dicebear.com/7.x/${config.style}/svg?seed=${encodeURIComponent(config.seed)}`;
    return _jsx(AvatarImage, { src: url, alt: "avatar", size: size });
}
const AvatarImage = styled.img `
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.card};
  flex-shrink: 0;
`;
