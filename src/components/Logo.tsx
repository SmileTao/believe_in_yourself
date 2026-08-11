/** 士别三日 Logo：三道递进放射弧线（三日一寸，日出之光） */
interface LogoProps {
  size?: number;
  withBg?: boolean;
}

export default function Logo({ size = 40, withBg = true }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logo-sunset" x1="100" y1="170" x2="100" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FF6B47" />
          <stop offset="0.5" stopColor="#FF9A56" />
          <stop offset="1" stopColor="#FFB37A" />
        </linearGradient>
      </defs>
      {withBg && <rect width="200" height="200" rx="48" fill="#FFFFFF" />}
      {/* 三道递进弧线：以底部中心向上放射 */}
      <path
        d="M58 165 A42 42 0 0 1 142 165"
        stroke="url(#logo-sunset)"
        strokeWidth="7"
        strokeLinecap="round"
        opacity="0.4"
      />
      <path
        d="M32 165 A68 68 0 0 1 168 165"
        stroke="url(#logo-sunset)"
        strokeWidth="7"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M6 165 A94 94 0 0 1 194 165"
        stroke="url(#logo-sunset)"
        strokeWidth="7"
        strokeLinecap="round"
      />
    </svg>
  );
}
