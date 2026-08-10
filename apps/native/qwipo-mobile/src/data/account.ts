export const BUSINESS = {
  name: 'Sri Venkateswara Kirana Store',
  owner: 'Ramesh Kumar',
  type: 'Kirana / General Store',
  gstin: '36ABCDE1234F1Z5',
  phone: '+91 98765 43210',
  address: '12-3-45, Main Bazaar Road, Vijayawada, AP 520001',
};

export interface Address {
  id: string;
  title: string;
  line: string;
  isDefault?: boolean;
}

export const ADDRESSES: Address[] = [
  { id: 'a1', title: 'Store', line: '12-3-45, Main Bazaar Road, Vijayawada, AP 520001', isDefault: true },
  { id: 'a2', title: 'Warehouse', line: 'Plot 27, Auto Nagar, Vijayawada, AP 520007' },
  { id: 'a3', title: 'Home', line: 'Flat 502, Green Meadows, Benz Circle, Vijayawada', },
];

export const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
];
