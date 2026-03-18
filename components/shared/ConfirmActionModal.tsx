import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";

export function ConfirmActionModal({
  open,
  onClose,
  title,
  description,
  onConfirm,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
      title={title}
      description={description}
      onConfirm={onConfirm}
      confirmLabel={loading ? "Working..." : "Confirm"}
    />
  );
}
