/**
 * Dialog de confirmation. Squelette — à wrapper sur Radix Dialog en UI/UX.
 */
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog(_props: ConfirmDialogProps) {
  return null;
}
