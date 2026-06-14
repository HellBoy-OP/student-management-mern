import { StudentForm, type StudentFormInitialValues } from "./StudentForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "./ui/dialog";

export const UpdateDialog = ({
  initialValues,
  open,
  setOpen,
  onSuccess,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  initialValues: StudentFormInitialValues | undefined;
  onSuccess?: (student?: StudentFormInitialValues) => void;
}) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Student</DialogTitle>
          <DialogDescription>
            Make changes to the student details here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-80 overflow-y-auto">
          <StudentForm
            className="py-0 border-0"
            initialValues={initialValues}
            onSuccess={(student) => {
              onSuccess?.(student);
              setOpen(false);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
