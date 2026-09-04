import type { StopType } from '../types'

interface IconProps {
  className?: string
}

export function PinIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 1.5a4.5 4.5 0 0 0-4.5 4.5c0 3.2 4.5 8.5 4.5 8.5s4.5-5.3 4.5-8.5A4.5 4.5 0 0 0 8 1.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="8" cy="6" r="1.4" fill="currentColor" />
    </svg>
  )
}

export function BoxIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2.5 5.5 8 2.5l5.5 3v7L8 13.5l-5.5-3v-5Z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 8v5.5M2.5 5.5 8 8l5.5-2.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

export function FlagIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 2.5v11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M4 3.5h8l-1.8 2.5L12 8.5H4" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
}

export function FuelIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3.5 2.5h6v11h-6v-11Z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 5h3M9.5 5.5l3 1.5v5a1.5 1.5 0 1 1-1.5 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function BreakIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M5 3.5v9M11 3.5v9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function RestIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M11.5 9.5A4.5 4.5 0 0 1 6 3.8 5 5 0 1 0 11.5 9.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function RestartIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3.5 8A4.5 4.5 0 1 0 5 4.2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path d="M3 3.5v3h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="3.2" width="12" height="10.8" rx="1.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 6.4h12" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.2 2v2.4M10.8 2v2.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="4.4" y="8.2" width="2.1" height="2.1" rx="0.4" fill="currentColor" />
      <rect x="6.95" y="8.2" width="2.1" height="2.1" rx="0.4" fill="currentColor" opacity="0.45" />
      <rect x="9.5" y="8.2" width="2.1" height="2.1" rx="0.4" fill="currentColor" opacity="0.45" />
    </svg>
  )
}

export function PrinterIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M5 4.5V2.5h6v2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="3" y="6" width="10" height="5.5" rx="1.3" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 9.2h6V13.5H5V9.2Z" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="4.7" cy="8.1" r="0.6" fill="currentColor" />
    </svg>
  )
}

export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M10 3.5 5.5 8 10 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 3.5 10.5 8 6 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function RoadIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6.2 2.5 4.4 13.5M9.8 2.5l1.8 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M8 3.4v2.1M8 7.4v2.1M8 11.4v1.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="5.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 5.2V8l2 1.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function DutyIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="3.2" y="2.6" width="9.6" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6 2.6h4v1.8H6V2.6Z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.6 7.6h4.8M5.6 10.2h3.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function CycleIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M12.6 6.2A4.8 4.8 0 1 0 13 8.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path d="M12.6 3.6v2.8h-2.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ListIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="3.4" cy="4" r="1.1" fill="currentColor" />
      <circle cx="3.4" cy="8" r="1.1" fill="currentColor" />
      <circle cx="3.4" cy="12" r="1.1" fill="currentColor" />
      <path d="M6.4 4h6.2M6.4 8h6.2M6.4 12h6.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function PathIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="4" cy="3.6" r="1.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="12" cy="12.4" r="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.2 4.8 10.6 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function PlayIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6.6 5.4 11 8 6.6 10.6V5.4Z" fill="currentColor" />
    </svg>
  )
}

export const STOP_COLORS: Record<StopType, string> = {
  current: '#3b82f6',
  pickup: '#22c55e',
  dropoff: '#f43f5e',
  fuel: '#f59e0b',
  break: '#14b8a6',
  rest: '#6366f1',
  restart: '#d946ef',
}

export function StopTypeIcon({ type, className }: { type: StopType; className?: string }) {
  if (type === 'pickup') return <BoxIcon className={className} />
  if (type === 'dropoff') return <FlagIcon className={className} />
  if (type === 'fuel') return <FuelIcon className={className} />
  if (type === 'break') return <BreakIcon className={className} />
  if (type === 'rest') return <RestIcon className={className} />
  if (type === 'restart') return <RestartIcon className={className} />
  return <PinIcon className={className} />
}
