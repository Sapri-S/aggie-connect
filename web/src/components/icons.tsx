import type { ReactNode } from "react";

// Our own small icon set (no icon library). 24×24, 2px strokes. Navigation
// icons have a filled version for the active tab.

function Icon({ children, className = "h-6 w-6" }: { children: ReactNode; className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

type NavIconProps = { filled?: boolean; className?: string };

export const HomeIcon = ({ filled, className }: NavIconProps) => (
  <Icon className={className}>
    {filled ? (
      <path fill="currentColor" d="M12 3 3 10.5V21h6.5v-6h5v6H21V10.5z" />
    ) : (
      <>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9v11h5v-6h4v6h5V9" />
      </>
    )}
  </Icon>
);

export const SearchIcon = ({ filled, className }: NavIconProps) => (
  <Icon className={className}>
    <circle cx="11" cy="11" r="7" strokeWidth={filled ? 3 : 2} />
    <path d="m20 20-3.5-3.5" strokeWidth={filled ? 3 : 2} />
  </Icon>
);

export const PeopleIcon = ({ filled, className }: NavIconProps) => (
  <Icon className={className}>
    {filled ? (
      <g fill="currentColor" stroke="none">
        <circle cx="9" cy="8" r="3.75" />
        <path d="M2 20.5a7 7 0 0 1 14 0z" />
        <circle cx="17" cy="9" r="2.75" />
        <path d="M17.2 20.5H22a5 5 0 0 0-6.9-4.6 8.4 8.4 0 0 1 2.1 4.6z" />
      </g>
    ) : (
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
        <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" />
        <path d="M18 14.2a6.5 6.5 0 0 1 3.5 5.8" />
      </>
    )}
  </Icon>
);

export const PersonIcon = ({ filled, className }: NavIconProps) => (
  <Icon className={className}>
    {filled ? (
      <g fill="currentColor" stroke="none">
        <circle cx="12" cy="8" r="4.25" />
        <path d="M3.5 21.5a8.5 8.5 0 0 1 17 0z" />
      </g>
    ) : (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    )}
  </Icon>
);

export const MenuIcon = ({ className }: NavIconProps) => (
  <Icon className={className}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </Icon>
);

export const HelpIcon = ({ className }: NavIconProps) => (
  <Icon className={className}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4" />
    <path d="m5.6 5.6 3.6 3.6M14.8 14.8l3.6 3.6M18.4 5.6l-3.6 3.6M9.2 14.8l-3.6 3.6" />
  </Icon>
);

export const EditIcon = ({ className }: NavIconProps) => (
  <Icon className={className}>
    <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" />
    <path d="m13.5 6.5 4 4" />
  </Icon>
);

export const KeyIcon = ({ className }: NavIconProps) => (
  <Icon className={className}>
    <circle cx="8" cy="15" r="4" />
    <path d="m10.8 12.2 8.7-8.7M16 7l3 3M14 9l2 2" />
  </Icon>
);

export const ExternalIcon = ({ className }: NavIconProps) => (
  <Icon className={className}>
    <path d="M14 4h6v6M20 4l-9 9" />
    <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </Icon>
);
