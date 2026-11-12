import React from 'react';

import { MeasurementBottomSheet } from '@/components/dashboard/measurement-bottom-sheet';
import { ClientMeasurement } from '@/types/measurement';

export interface AddMeasurementModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (measurement: ClientMeasurement) => void;
}

/**
 * Legacy modal wrapper that delegates to the requested Bottom Sheet
 */
export function AddMeasurementModal({ visible, onClose, onSave }: AddMeasurementModalProps) {
  return (
    <MeasurementBottomSheet
      visible={visible}
      onClose={onClose}
      onSave={onSave}
    />
  );
}
