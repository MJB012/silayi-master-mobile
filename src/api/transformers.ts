import { ClientMeasurement, GarmentType, OrderStatus, PaymentStatus } from '@/types/measurement';

/**
 * Transforms a backend Measurement document to the frontend ClientMeasurement structure
 */
export const transformBackendToClientMeasurement = (raw: any): ClientMeasurement => {
  return {
    id: raw._id || raw.id,
    serialNumber: raw.serial_number || '',
    receiptNumber: raw.receipt_number || '',
    clientName: raw.client_name || '',
    clientPhone: raw.client_phone || '',
    garmentType: (raw.garment_type as GarmentType) || 'shalwar_kameez',
    orderDate: raw.order_date || new Date().toLocaleDateString('en-GB'),
    deliveryDate: raw.delivery_date || '',
    status: (raw.status as OrderStatus) || 'in_progress',
    urgent: !!raw.urgent,
    kameez: {
      length: raw.kameez?.length || '',
      shoulder: raw.kameez?.shoulder || '',
      sleeves: raw.kameez?.sleeves || '',
      collar: raw.kameez?.collar || '',
      chest: raw.kameez?.chest || '',
      waist: raw.kameez?.waist || '',
      daman: raw.kameez?.daman || '',
    },
    shalwar: {
      length: raw.shalwar?.length || '',
      paoncha: raw.shalwar?.paoncha || '',
      asan: raw.shalwar?.asan || '',
      waist: raw.shalwar?.waist || '',
    },
    styleNotes: raw.style_notes || '',
    totalAmount: raw.total_amount ?? 0,
    advanceAmount: raw.advance_amount ?? 0,
    paymentStatus: (raw.payment_status as PaymentStatus) || 'unpaid',
    lastStitchedDate: raw.last_stitched_date || raw.order_date || '',
    history: Array.isArray(raw.history)
      ? raw.history.map((h: any) => ({
          id: h._id || h.id || Math.random().toString(),
          garmentType: h.garment_type || 'shalwar_kameez',
          stitchedDate: h.stitched_date || '',
          receiptNumber: h.receipt_number || '',
          totalAmount: h.total_amount ?? 0,
          paidAmount: h.paid_amount ?? 0,
          paymentStatus: h.payment_status || 'paid',
          notes: h.notes || '',
          kameez: h.kameez,
          shalwar: h.shalwar,
        }))
      : [],
  };
};

/**
 * Transforms a frontend ClientMeasurement payload to the backend DTO structure
 */
export const transformClientToBackendMeasurementDto = (m: Partial<ClientMeasurement>): any => {
  return {
    client_name: m.clientName,
    client_phone: m.clientPhone,
    serial_number: m.serialNumber,
    receipt_number: m.receiptNumber,
    garment_type: m.garmentType,
    order_date: m.orderDate,
    delivery_date: m.deliveryDate,
    status: m.status,
    urgent: m.urgent,
    kameez: m.kameez,
    shalwar: m.shalwar,
    style_notes: m.styleNotes,
    total_amount: Number(m.totalAmount ?? 0),
    advance_amount: Number(m.advanceAmount ?? 0),
    payment_status: m.paymentStatus,
  };
};
