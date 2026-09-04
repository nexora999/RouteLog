export type DutyStatus = 'off_duty' | 'sleeper' | 'driving' | 'on_duty'

export type StopType =
  | 'current'
  | 'pickup'
  | 'dropoff'
  | 'fuel'
  | 'break'
  | 'rest'
  | 'restart'

export interface Place {
  query?: string
  lat: number
  lng: number
  label: string
  display_name?: string
}

export interface RouteStop {
  type: StopType
  title: string
  location: string
  lat: number
  lng: number
  time: string
  duration_hours: number
  remark: string
  miles_from_start: number
}

export interface LogSegment {
  status: DutyStatus
  start_hour: number
  end_hour: number
  duration_hours: number
  remark: string
}

export interface DailyLog {
  sheet: number
  date: string
  month: string
  day: string
  year: string
  from: string
  to: string
  total_miles_driving: number
  total_mileage: number
  segments: LogSegment[]
  totals: Record<DutyStatus, number>
  on_duty_today: number
  remarks: {
    time: string
    hour: number
    end_hour?: number
    duration_hours?: number
    text: string
    status: DutyStatus
  }[]
  recap: { on_duty_today: number; a: number; b: number; c: number }
  carrier: Carrier
}

export interface Carrier {
  name: string
  main_office: string
  home_terminal: string
  truck: string
  driver: string
}

export interface PlanResponse {
  inputs: {
    current_location: Place
    pickup_location: Place
    dropoff_location: Place
    current_cycle_used: number
    start_time: string
  }
  carrier: Carrier
  route: {
    distance_miles: number
    duration_hours: number
    geometry: [number, number][]
    legs: {
      label: string
      from: string
      to: string
      distance_miles: number
      duration_hours: number
    }[]
    stops: RouteStop[]
  }
  hos: {
    cycle_used_start: number
    cycle_used_end: number
    hours_available_end: number
    driving_hours: number
    on_duty_hours: number
    days: number
    rules: Record<string, string>
  }
  logs: DailyLog[]
  events: Record<string, unknown>[]
}

export interface TripPayload {
  current_location: string
  pickup_location: string
  dropoff_location: string
  current_cycle_used: number
}
