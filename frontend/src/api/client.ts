export const API_BASE_URLS = {
  AUTH: 'http://localhost:3001',
  WORKER: 'http://localhost:3002',
  JOB: 'http://localhost:3003',
  BOOKING: 'http://localhost:3004',
  LANGUAGE: 'http://localhost:3005',
};

export interface ServiceDomain {
  id: string;
  nameKey: string;
  icon: string;
  baseRate: number;
  popular?: boolean;
}

export const SERVICE_DOMAINS: ServiceDomain[] = [
  { id: 'PLUMBING', nameKey: 'plumbing', icon: 'wrench', baseRate: 350, popular: true },
  { id: 'ELECTRICAL', nameKey: 'electrical', icon: 'zap', baseRate: 300, popular: true },
  { id: 'CARPENTRY', nameKey: 'carpentry', icon: 'hammer', baseRate: 450 },
  { id: 'PAINTING', nameKey: 'painting', icon: 'paint-brush', baseRate: 800 },
  { id: 'CLEANING', nameKey: 'cleaning', icon: 'sparkles', baseRate: 500, popular: true },
  { id: 'APPLIANCE', nameKey: 'appliance', icon: 'cpu', baseRate: 400 },
  { id: 'GARDENING', nameKey: 'gardening', icon: 'leaf', baseRate: 350 },
  { id: 'DRIVING', nameKey: 'driving', icon: 'car', baseRate: 600 },
  { id: 'CAREGIVING', nameKey: 'caregiving', icon: 'heart', baseRate: 700 },
];

export interface ActiveBooking {
  id: string;
  serviceDomain: string;
  serviceTitle: string;
  problemDescription: string;
  address: string;
  urgency: 'IMMEDIATE' | 'SCHEDULED';
  scheduledTime: string;
  estimatedAmount: number;
  status: 'REQUESTED' | 'MATCHED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED';
  worker: {
    name: string;
    phone: string;
    society: string;
    membershipId: string;
    rating: number;
    distance: string;
    etaMinutes: number;
  };
  fairAllocationBreakdown: {
    workerShare: number;      // 88%
    welfareFundShare: number; // 7%
    platformFee: number;      // 5%
    total: number;
  };
  createdAt: string;
}

export const INITIAL_BOOKINGS: ActiveBooking[] = [
  {
    id: 'BK-2024-001',
    serviceDomain: 'PLUMBING',
    serviceTitle: 'Main Water Line Valve Leakage',
    problemDescription: 'High pressure leak in bathroom overhead supply pipe. Need urgent stopcock replacement.',
    address: 'Flat 402, Shanti Kunj, Near Cooperative Bank, Shivajinagar, Pune',
    urgency: 'IMMEDIATE',
    scheduledTime: 'Today, within 25 mins',
    estimatedAmount: 480,
    status: 'ACCEPTED',
    worker: {
      name: 'Rameshwar Pawar',
      phone: '+91 94220 87654',
      society: 'Maharashtra Shramik Labour Cooperative Federation Ltd.',
      membershipId: 'MSLCF-2024-8842',
      rating: 4.9,
      distance: '1.4 km',
      etaMinutes: 12,
    },
    fairAllocationBreakdown: {
      workerShare: 422.4,
      welfareFundShare: 33.6,
      platformFee: 24.0,
      total: 480,
    },
    createdAt: '10 mins ago',
  },
];
