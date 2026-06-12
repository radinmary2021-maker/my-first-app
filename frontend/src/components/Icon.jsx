/**
 * Icon primitives — all icons share the same API:
 *
 *   size      number  default 20  — sets width + height in px
 *   className string  default ''  — appended to svg className
 *   style     object              — passed directly to svg
 *
 * All paths are stroke-based (fill="none"), strokeWidth=2,
 * strokeLinecap/Linejoin="round", viewBox="0 0 24 24".
 */

function Icon({ size = 20, className = '', style, children, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

// ── General UI ──────────────────────────────────────────────────────────────────

export function SearchIcon(p) {
  return <Icon {...p}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></Icon>
}

export function CalendarIcon(p) {
  return <Icon {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></Icon>
}

export function CalendarCheckIcon(p) {
  return <Icon {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M9 16l2 2 4-4"/></Icon>
}

export function ClockIcon(p) {
  return <Icon {...p}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></Icon>
}

export function CheckIcon(p) {
  return <Icon {...p}><path d="M20 6L9 17l-5-5"/></Icon>
}

export function CheckCircleIcon(p) {
  return <Icon {...p}><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></Icon>
}

export function XIcon(p) {
  return <Icon {...p}><path d="M18 6L6 18M6 6l12 12"/></Icon>
}

export function XCircleIcon(p) {
  return <Icon {...p}><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></Icon>
}

export function AlertCircleIcon(p) {
  return <Icon {...p}><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></Icon>
}

export function InfoIcon(p) {
  return <Icon {...p}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></Icon>
}

export function RefreshCwIcon(p) {
  return <Icon {...p}><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></Icon>
}

export function ChevronRightIcon(p) {
  return <Icon {...p}><path d="M9 18l6-6-6-6"/></Icon>
}

export function ChevronLeftIcon(p) {
  return <Icon {...p}><path d="M15 18l-6-6 6-6"/></Icon>
}

export function ArrowRightIcon(p) {
  return <Icon {...p}><path d="M5 12h14M12 5l7 7-7 7"/></Icon>
}

export function ArrowLeftIcon(p) {
  return <Icon {...p}><path d="M19 12H5M12 19l-7-7 7-7"/></Icon>
}

export function UserIcon(p) {
  return <Icon {...p}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></Icon>
}

export function UsersIcon(p) {
  return <Icon {...p}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></Icon>
}

export function BuildingIcon(p) {
  return <Icon {...p}><path d="M3 21h18M9 21V5a2 2 0 012-2h2a2 2 0 012 2v16M3 7l9-4 9 4"/><path d="M9 10h6M9 14h6M9 18h6"/></Icon>
}

export function SmartphoneIcon(p) {
  return <Icon {...p}><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></Icon>
}

export function BellIcon(p) {
  return <Icon {...p}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></Icon>
}

export function CreditCardIcon(p) {
  return <Icon {...p}><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></Icon>
}

export function PlusIcon(p) {
  return <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>
}

export function Trash2Icon(p) {
  return <Icon {...p}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></Icon>
}

export function EditIcon(p) {
  return <Icon {...p}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></Icon>
}

export function BarChart2Icon(p) {
  return <Icon {...p}><path d="M18 20V10M12 20V4M6 20v-6"/></Icon>
}

export function MapPinIcon(p) {
  return <Icon {...p}><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></Icon>
}

// ── Category / business-type icons ─────────────────────────────────────────────

export function StethoscopeIcon(p) {
  return (
    <Icon {...p}>
      <path d="M4.8 2.3A.3.3 0 105 2H4a2 2 0 00-2 2v5a6 6 0 006 6 6 6 0 006-6V4a2 2 0 00-2-2h-1a.2.2 0 10.3.3"/>
      <path d="M8 15v1a6 6 0 006 6 6 6 0 006-6v-4"/>
      <circle cx="20" cy="10" r="2"/>
    </Icon>
  )
}

export function ScissorsIcon(p) {
  return (
    <Icon {...p}>
      <circle cx="6" cy="6" r="3"/>
      <circle cx="6" cy="18" r="3"/>
      <path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12"/>
    </Icon>
  )
}

export function ScaleIcon(p) {
  return (
    <Icon {...p}>
      <path d="M12 3v3M3 9l4 8a5 5 0 005-5H3zM21 9l-4 8a5 5 0 01-5-5h9z"/>
      <path d="M5 21h14M12 3L5 9M12 3l7 6"/>
    </Icon>
  )
}

export function WalletIcon(p) {
  return (
    <Icon {...p}>
      <path d="M20 12V8H6a2 2 0 01-2-2c0-1.1.9-2 2-2h12v4"/>
      <path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/>
      <path d="M18 12a2 2 0 000 4h4v-4z"/>
    </Icon>
  )
}

export function BrainIcon(p) {
  return (
    <Icon {...p}>
      <path d="M9.5 2A2.5 2.5 0 017 4.5v0A2.5 2.5 0 014.5 7v0a2 2 0 00-2 2v0a2 2 0 002 2v0a2.5 2.5 0 000 5v0A2.5 2.5 0 007 18.5v0a2.5 2.5 0 002.5 2.5h5a2.5 2.5 0 002.5-2.5v0a2.5 2.5 0 002.5-2.5v0a2 2 0 002-2v0a2 2 0 00-2-2v0a2.5 2.5 0 000-5v0A2.5 2.5 0 0017 4.5v0A2.5 2.5 0 0014.5 2z"/>
      <path d="M12 2v20M12 7c-1.5 0-3 .5-3 2s1.5 2 3 2 3 .5 3 2-1.5 2-3 2"/>
    </Icon>
  )
}

export function DumbbellIcon(p) {
  return (
    <Icon {...p}>
      <path d="M6.5 6.5h11M6.5 17.5h11M3 9.5h3v5H3zM18 9.5h3v5h-3z"/>
      <path d="M6.5 12h11"/>
    </Icon>
  )
}

export function BookOpenIcon(p) {
  return (
    <Icon {...p}>
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
    </Icon>
  )
}

export function PawPrintIcon(p) {
  return (
    <Icon {...p}>
      <circle cx="11" cy="4" r="2"/>
      <circle cx="18" cy="8" r="2"/>
      <circle cx="5" cy="8" r="2"/>
      <circle cx="15" cy="13" r="2"/>
      <path d="M9.78 11.16l-1.76 3.61a.7.7 0 000 .62l1.6 3.3a.7.7 0 00.63.4h3.5a.7.7 0 00.63-.4l1.6-3.3a.7.7 0 000-.62l-1.76-3.61A1.49 1.49 0 0012.5 10h-1a1.49 1.49 0 00-1.72 1.16z"/>
    </Icon>
  )
}

export function WrenchIcon(p) {
  return (
    <Icon {...p}>
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
    </Icon>
  )
}

export function BriefcaseIcon(p) {
  return (
    <Icon {...p}>
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2M12 12h.01M8 12h.01M16 12h.01"/>
    </Icon>
  )
}

export function CameraIcon(p) {
  return (
    <Icon {...p}>
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </Icon>
  )
}

// ── Category → Icon map ─────────────────────────────────────────────────────────

/**
 * Maps BusinessCategory values (from Django model) to their Icon component.
 * Usage:
 *   const CategoryIcon = CATEGORY_ICON[provider.category] ?? CATEGORY_ICON.other
 *   <CategoryIcon size={20} />
 */
export const CATEGORY_ICON = {
  medical:       StethoscopeIcon,
  beauty:        ScissorsIcon,
  legal:         ScaleIcon,
  financial:     WalletIcon,
  psychological: BrainIcon,
  fitness:       DumbbellIcon,
  education:     BookOpenIcon,
  veterinary:    PawPrintIcon,
  automotive:    WrenchIcon,
  other:         BriefcaseIcon,
}
