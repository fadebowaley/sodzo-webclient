// Mock data for Givings & Donations module

export interface Donation {
  id: string;
  donorName: string;
  amount: number;
  category: DonationCategory;
  paymentMethod: PaymentMethod;
  date: Date;
  purpose?: string;
  status: 'completed' | 'pending' | 'failed';
  reference?: string;
}

export interface DonationCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'link' | 'qr' | 'bank' | 'ussd' | 'card';
  icon: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  bankCode?: string;
  logo?: string;
}

export interface PaymentLink {
  id: string;
  title: string;
  amount?: number;
  purpose: string;
  link: string;
  createdAt: Date;
  expiresAt?: Date;
  status: 'active' | 'expired' | 'used';
  usageCount: number;
}

export interface QRCode {
  id: string;
  title: string;
  amount?: number;
  purpose: string;
  qrData: string;
  createdAt: Date;
  expiresAt?: Date;
  status?: 'active' | 'expired' | 'used';
  usageCount: number;
}

export interface USSDCode {
  id: string;
  amount: number;
  code: string;
  createdAt: Date;
  expiresAt: Date;
  status: 'active' | 'expired' | 'used';
}

export interface DonationAnalytics {
  totalToday: number;
  totalThisWeek: number;
  totalThisMonth: number;
  totalThisYear: number;
  byMethod: { method: string; amount: number; count: number }[];
  byCategory: { category: string; amount: number; count: number }[];
  topContributors: { name: string; amount: number; count: number }[];
  dailyBreakdown: { date: string; amount: number; count: number }[];
  weeklyBreakdown: { week: string; amount: number; count: number }[];
  monthlyBreakdown: { month: string; amount: number; count: number }[];
}

export const donationCategories: DonationCategory[] = [
  {
    id: '1',
    name: 'Tithes',
    description: 'Regular tithe contributions',
    icon: 'Heart',
    color: 'bg-red-500',
  },
  {
    id: '2',
    name: 'Offerings',
    description: 'General offerings and gifts',
    icon: 'Gift',
    color: 'bg-blue-500',
  },
  {
    id: '3',
    name: 'Welfare',
    description: 'Support for community welfare',
    icon: 'HandHeart',
    color: 'bg-green-500',
  },
  {
    id: '4',
    name: 'Missions',
    description: 'Missionary and outreach support',
    icon: 'Globe',
    color: 'bg-purple-500',
  },
  {
    id: '5',
    name: 'Projects',
    description: 'Building and project funds',
    icon: 'Building',
    color: 'bg-orange-500',
  },
  {
    id: '6',
    name: 'Special Seeds',
    description: 'Special seed offerings',
    icon: 'Sprout',
    color: 'bg-yellow-500',
  },
];

export const paymentMethods: PaymentMethod[] = [
  {
    id: '1',
    name: 'Payment Link',
    type: 'link',
    icon: 'Link',
  },
  {
    id: '2',
    name: 'QR Code',
    type: 'qr',
    icon: 'QrCode',
  },
  {
    id: '3',
    name: 'Bank Transfer',
    type: 'bank',
    icon: 'Building2',
  },
  {
    id: '4',
    name: 'USSD Code',
    type: 'ussd',
    icon: 'Phone',
  },
];

export const bankAccounts: BankAccount[] = [
  {
    id: '1',
    bankName: 'Access Bank',
    accountName: 'The Sword of the Spirit Ministries',
    accountNumber: '0123456789',
    bankCode: '044',
    logo: '🏦',
  },
  {
    id: '2',
    bankName: 'GTBank',
    accountName: 'The Sword of the Spirit Ministries',
    accountNumber: '9876543210',
    bankCode: '058',
    logo: '🏦',
  },
  {
    id: '3',
    bankName: 'First Bank',
    accountName: 'The Sword of the Spirit Ministries',
    accountNumber: '1122334455',
    bankCode: '011',
    logo: '🏦',
  },
];

// Generate mock donations
const generateMockDonations = (): Donation[] => {
  const donors = [
    'John Doe',
    'Sarah Johnson',
    'Michael Chen',
    'Emily Rodriguez',
    'David Kim',
    'Olivia Brown',
    'James Wilson',
    'Maria Garcia',
    'Robert Taylor',
    'Jennifer Martinez',
  ];

  const purposes = [
    'Tithe for January',
    'General Offering',
    'Building Fund',
    'Mission Support',
    'Welfare Fund',
    'Special Seed',
    'Thanksgiving Offering',
    'Youth Ministry',
    'Children Ministry',
    'Music Ministry',
  ];

  const donations: Donation[] = [];
  const now = new Date();

  for (let i = 0; i < 50; i++) {
    const daysAgo = Math.floor(Math.random() * 90); // Last 90 days
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);

    const category = donationCategories[Math.floor(Math.random() * donationCategories.length)];
    const method = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    const amount = Math.floor(Math.random() * 50000) + 1000; // 1000 to 50000

    donations.push({
      id: `donation-${i + 1}`,
      donorName: donors[Math.floor(Math.random() * donors.length)],
      amount,
      category,
      paymentMethod: method,
      date,
      purpose: purposes[Math.floor(Math.random() * purposes.length)],
      status: Math.random() > 0.1 ? 'completed' : 'pending',
      reference: `REF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    });
  }

  return donations.sort((a, b) => b.date.getTime() - a.date.getTime());
};

export const mockDonations: Donation[] = generateMockDonations();

// Generate mock payment links
export const mockPaymentLinks: PaymentLink[] = [
  {
    id: '1',
    title: 'January Tithe Collection',
    amount: 5000,
    purpose: 'Monthly tithe collection',
    link: 'https://givings.sodzo.com/pay/jan-tithe-2024',
    createdAt: new Date('2024-01-01'),
    expiresAt: new Date('2024-02-01'),
    status: 'active',
    usageCount: 45,
  },
  {
    id: '2',
    title: 'Building Fund',
    amount: undefined,
    purpose: 'Church building project',
    link: 'https://givings.sodzo.com/pay/building-fund',
    createdAt: new Date('2024-01-15'),
    status: 'active',
    usageCount: 120,
  },
  {
    id: '3',
    title: 'Mission Support',
    amount: 10000,
    purpose: 'Missionary support fund',
    link: 'https://givings.sodzo.com/pay/mission-2024',
    createdAt: new Date('2023-12-01'),
    expiresAt: new Date('2024-01-01'),
    status: 'expired',
    usageCount: 30,
  },
];

// Generate mock QR codes
export const mockQRCodes: QRCode[] = [
  {
    id: '1',
    title: 'General Offering QR',
    amount: undefined,
    purpose: 'General church offerings',
    qrData: 'https://givings.sodzo.com/qr/general-offering',
    createdAt: new Date('2024-01-01'),
    status: 'active',
    usageCount: 200,
  },
  {
    id: '2',
    title: 'Tithe QR Code',
    amount: 5000,
    purpose: 'Monthly tithe',
    qrData: 'https://givings.sodzo.com/qr/tithe-jan',
    createdAt: new Date('2024-01-05'),
    expiresAt: new Date('2024-02-05'),
    status: 'active',
    usageCount: 150,
  },
  {
    id: '3',
    title: 'Special Event QR',
    amount: 2000,
    purpose: 'Special service offering',
    qrData: 'https://givings.sodzo.com/qr/special-event',
    createdAt: new Date('2023-12-20'),
    expiresAt: new Date('2024-01-20'),
    status: 'expired',
    usageCount: 80,
  },
];

// Generate mock USSD codes
export const mockUSSDCodes: USSDCode[] = [
  {
    id: '1',
    amount: 5000,
    code: '*737*1*0123456789*5000#',
    createdAt: new Date('2024-01-20'),
    expiresAt: new Date('2024-01-27'),
    status: 'active',
  },
  {
    id: '2',
    amount: 10000,
    code: '*737*1*0123456789*10000#',
    createdAt: new Date('2024-01-18'),
    expiresAt: new Date('2024-01-25'),
    status: 'active',
  },
  {
    id: '3',
    amount: 2000,
    code: '*737*1*0123456789*2000#',
    createdAt: new Date('2024-01-15'),
    expiresAt: new Date('2024-01-22'),
    status: 'expired',
  },
];

// Generate analytics data
export const mockDonationAnalytics: DonationAnalytics = {
  totalToday: 125000,
  totalThisWeek: 850000,
  totalThisMonth: 3200000,
  totalThisYear: 15000000,
  byMethod: [
    { method: 'Payment Link', amount: 1200000, count: 45 },
    { method: 'QR Code', amount: 800000, count: 120 },
    { method: 'Bank Transfer', amount: 900000, count: 60 },
    { method: 'USSD Code', amount: 300000, count: 25 },
  ],
  byCategory: [
    { category: 'Tithes', amount: 1500000, count: 200 },
    { category: 'Offerings', amount: 800000, count: 150 },
    { category: 'Welfare', amount: 400000, count: 80 },
    { category: 'Missions', amount: 300000, count: 50 },
    { category: 'Projects', amount: 200000, count: 30 },
    { category: 'Special Seeds', amount: 100000, count: 20 },
  ],
  topContributors: [
    { name: 'John Doe', amount: 150000, count: 12 },
    { name: 'Sarah Johnson', amount: 120000, count: 10 },
    { name: 'Michael Chen', amount: 100000, count: 8 },
    { name: 'Emily Rodriguez', amount: 90000, count: 9 },
    { name: 'David Kim', amount: 80000, count: 7 },
  ],
  dailyBreakdown: Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      date: date.toISOString().split('T')[0],
      amount: Math.floor(Math.random() * 200000) + 50000,
      count: Math.floor(Math.random() * 50) + 10,
    };
  }),
  weeklyBreakdown: Array.from({ length: 12 }, (_, i) => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (11 - i) * 7);
    return {
      week: `Week ${i + 1}`,
      amount: Math.floor(Math.random() * 500000) + 200000,
      count: Math.floor(Math.random() * 200) + 50,
    };
  }),
  monthlyBreakdown: Array.from({ length: 12 }, (_, i) => {
    const month = new Date(2024, i, 1);
    return {
      month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      amount: Math.floor(Math.random() * 2000000) + 1000000,
      count: Math.floor(Math.random() * 500) + 200,
    };
  }),
};

