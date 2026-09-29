import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg";

// A scalable mascot for the supplied screenshot reference; no screenshot is shipped in the app.
export function Gopher({ size = 108 }: { size?: number }) {
  return (
    <Svg
      width={size * 0.62}
      height={size}
      viewBox="0 0 64 108"
      accessibilityLabel="GopherFit mascot"
      role="img"
    >
      <Path
        d="M15 79 Q12 89 15 106 H27 L29 84 H35 L38 106 H50 Q52 91 48 79Z"
        fill="#e9c8a0"
      />
      <Rect x="12" y="48" width="40" height="39" rx="12" fill="#850622" />
      <Path d="M13 62H51V69H13Z" fill="#efb52b" />
      <Path
        d="M16 52L26 57L23 63M48 52L38 57L41 63M16 77L22 72L27 82M48 77L42 72L37 82"
        stroke="#aa2635"
        strokeWidth="3"
        fill="none"
      />
      <Ellipse cx="10" cy="68" rx="7" ry="17" fill="#e9c8a0" />
      <Ellipse cx="54" cy="68" rx="7" ry="17" fill="#e9c8a0" />
      <Ellipse cx="32" cy="27" rx="25" ry="26" fill="#e9c8a0" />
      <Ellipse cx="10" cy="15" rx="9" ry="13" fill="#e9c8a0" />
      <Ellipse cx="54" cy="15" rx="9" ry="13" fill="#e9c8a0" />
      <Ellipse cx="10" cy="16" rx="5" ry="8" fill="#f4b6b4" />
      <Ellipse cx="54" cy="16" rx="5" ry="8" fill="#f4b6b4" />
      <Circle cx="22" cy="28" r="4.3" fill="#262525" />
      <Circle cx="43" cy="28" r="4.3" fill="#262525" />
      <Circle cx="23" cy="27" r="1.4" fill="white" />
      <Circle cx="44" cy="27" r="1.4" fill="white" />
      <Ellipse cx="32" cy="37" rx="6" ry="4" fill="#8b4b16" />
      <Path
        d="M24 41Q32 47 40 41"
        stroke="#502e12"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}
