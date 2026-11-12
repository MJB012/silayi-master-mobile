import * as Yup from 'yup';

export const measurementValidationSchema = Yup.object().shape({
  serialNumber: Yup.string()
    .trim()
    .required('Serial / Book No is required • سیریل نمبر ضروری ہے'),

  clientName: Yup.string()
    .trim()
    .min(2, 'Name must be at least 2 characters • نام کم از کم 2 حروف کا ہو')
    .required('Client name is required • گاہک کا نام ضروری ہے'),

  clientPhone: Yup.string()
    .trim()
    .required('Phone number is required • فون نمبر ضروری ہے')
    .matches(
      /^[0-9+\s\-()]{7,15}$/,
      'Enter a valid phone number • درست فون نمبر درج کریں'
    ),

  garmentType: Yup.string()
    .oneOf(['shalwar_kameez', 'kurta_pajama', 'waistcoat'])
    .required('Select a garment type • لباس کی قسم منتخب کریں'),

  orderDate: Yup.string().trim().optional(),

  deliveryDate: Yup.string()
    .trim()
    .required('Delivery date is required • ڈیلیوری تاریخ ضروری ہے'),

  kameezLength: Yup.string()
    .trim()
    .required('Length is required • لمبائی درج کریں'),

  shoulder: Yup.string()
    .trim()
    .required('Shoulder / Tera is required • تیرا درج کریں'),

  chest: Yup.string()
    .trim()
    .required('Chest / Chati is required • چھاتی درج کریں'),

  waist: Yup.string()
    .trim()
    .required('Waist / Kamar is required • کمر درج کریں'),

  collar: Yup.string()
    .trim()
    .required('Collar / Gala is required • گلا درج کریں'),

  daman: Yup.string()
    .trim()
    .required('Daman is required • دامن درج کریں'),

  // Conditional for Shalwar Kameez and Kurta Pajama (not required for waistcoat)
  sleeves: Yup.string().when('garmentType', {
    is: (val: string) => val !== 'waistcoat',
    then: (schema) => schema.required('Sleeves / Bazu is required • بازو درج کریں'),
    otherwise: (schema) => schema.optional(),
  }),

  shalwarLength: Yup.string().when('garmentType', {
    is: (val: string) => val !== 'waistcoat',
    then: (schema) => schema.required('Shalwar length is required • شلوار لمبائی درج کریں'),
    otherwise: (schema) => schema.optional(),
  }),

  paoncha: Yup.string().when('garmentType', {
    is: (val: string) => val !== 'waistcoat',
    then: (schema) => schema.required('Bottom opening is required • پانچہ درج کریں'),
    otherwise: (schema) => schema.optional(),
  }),

  asan: Yup.string().trim().optional(),
  styleNotes: Yup.string().trim().optional(),
  totalAmount: Yup.string().trim().optional(),
  advanceAmount: Yup.string().trim().optional(),
});

export type MeasurementFormValues = Yup.InferType<typeof measurementValidationSchema>;
