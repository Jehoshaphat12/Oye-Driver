export type VehicleType = 'motor' | 'delivery' | 'bicycle_delivery';
export type MotorMode = 'both' | 'rides' | 'deliveries';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  photoUrl?: string;
  userType: 'passenger' | 'driver';
  rating: number;
  avatar?: string;
  createdAt: Date | any;
  totalRides?: number;
  fcmToken: string | null;
  pushToken: string | null;
}

export type DriverRideState =
  | 'offline'
  | 'online'
  | 'request_received'
  | 'accepted'
  | 'arrived'
  | 'in_progress'
  | 'completed';

export interface LocationPoint {
  latitude: number;
  longitude: number;
  address: string;
}

export interface IncomingRide {
  id: string;
  passengerName: string;
  passengerRating?: number;
  passengerPhone?: string;
  pickup: LocationPoint;
  destination: LocationPoint;
  stops?: LocationPoint[];
  fare: number;
  distance?: string;
  distanceFromDriver?: number;
  vehicleType: VehicleType;
  isDelivery?: boolean;
  packageInfo?: { itemDescription?: string };
}

export interface ActiveRide extends IncomingRide {
  passengerId?: string;
  driverId?: string;
  status: string;
  totalFare?: number;
  requestedAt?: any;
  completedAt?: any;
  estimatedDuration?: number;
}

export interface Driver {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  rating?: number;
  totalTrips?: number;
  isOnline?: boolean;
  vehicle?: { vehicleType: VehicleType; vehicleNumber?: string; vehicleModel?: string };
}

export interface Earnings {
  today: number;
  weekly: number;
  tripsToday: number;
  weeklyTrips: number;
}

export interface TripRecord {
  id: string;
  pickup?: LocationPoint;
  destinations?: LocationPoint[];
  totalFare?: number;
  status: string;
  requestedAt?: any;
  completedAt?: any;
  passengerName?: string;
  vehicleType?: VehicleType;
  distance?: number;
}
