export type GarmentType = 'shalwar_kameez' | 'kurta_pajama' | 'waistcoat';

export type OrderStatus = 'in_progress' | 'ready' | 'delivered';

export type PaymentStatus = 'paid' | 'partial' | 'unpaid';

export interface KameezMeasurements {
  length: string; // لمبائی
  shoulder: string; // تیرا
  sleeves: string; // بازو (waistcoat will be N/A)
  collar: string; // گلا
  chest: string; // چھاتی
  waist: string; // کمر
  daman: string; // گھیرا / دامن
}

export interface ShalwarMeasurements {
  length: string; // لمبائی
  paoncha: string; // پانچہ
  asan?: string; // آسن
  waist?: string; // نیفہ / کمر
}

export interface StitchHistoryRecord {
  id: string;
  garmentType: GarmentType;
  stitchedDate: string;
  receiptNumber: string;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  notes?: string;
  kameez?: KameezMeasurements;
  shalwar?: ShalwarMeasurements;
}

export interface ClientMeasurement {
  id: string;
  serialNumber: string; // Shopkeeper manual book / slip number (سیریل نمبر)
  receiptNumber: string;
  clientName: string;
  clientPhone: string;
  garmentType: GarmentType;
  orderDate: string;
  deliveryDate: string;
  status: OrderStatus;
  urgent?: boolean;
  kameez: KameezMeasurements;
  shalwar: ShalwarMeasurements;
  styleNotes?: string;
  totalAmount: number;
  advanceAmount: number;
  paymentStatus: PaymentStatus;
  lastStitchedDate: string;
  history: StitchHistoryRecord[];
}

export const INITIAL_CLIENT_MEASUREMENTS: ClientMeasurement[] = [];
