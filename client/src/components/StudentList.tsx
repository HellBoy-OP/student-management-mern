import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { api, getApiErrorMessage } from "@/utils/api";
import { getAuthSession } from "@/utils/auth";
import { decryptStudentPayload } from "@/utils/crypto";
import { formatDate } from "@/utils/format";
import {
  BadgePlusIcon,
  EditIcon,
  EllipsisIcon,
  Trash2Icon
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from "./ui/dropdown-menu";
import { UpdateDialog } from "./UpdateDialog";

type Student = {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  address: string;
  courseEnrolled: string;
}

export const StudentList = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const authSession = getAuthSession();

  const handleDelete = async (id: string) => {
    try {
      const resp = await api.delete(`/student/${id}`)
      if (resp.ok) {
        toast.success("Deleted");
        setStudents((prev) => prev.filter((s) => s._id !== id));
      };
    } catch (error) {
      const errMsg = await getApiErrorMessage(error);
      toast.error(errMsg);
    }
  }

  useEffect(() => {
    const apiCall = async () => {
      const resp = await api.get<Student[]>("/students");
      if (resp.ok) {
        const encryptedStudents = await resp.json();
        setStudents(await Promise.all(encryptedStudents.map(decryptStudentPayload)))
      }
    }

    apiCall();
  }, []);

  return (
    <div className="max-w-7xl mx-auto w-full space-y-5 px-2 py-4">
      <div className="flex items-center justify-end">
        <Link to="/register">
          <Button>
            <BadgePlusIcon />
            Create
          </Button>
        </Link>
      </div>
      <Table>
        <TableCaption>Registered Students List</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Fullname</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>DOB</TableHead>
            <TableHead>Gender</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((s) => (
            <TableRow key={s._id}>
              <TableCell>{s.fullName}</TableCell>
              <TableCell>{s.email}</TableCell>
              <TableCell>{s.phoneNumber}</TableCell>
              <TableCell>{formatDate(new Date(s.dateOfBirth))}</TableCell>
              <TableCell>{s.gender}</TableCell>
              <TableCell>{s.address}</TableCell>
              <TableCell>{s.courseEnrolled}</TableCell>
              <TableCell>
                {authSession?.studentId === s._id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon-sm" variant="ghost">
                        <EllipsisIcon />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>
                        Quick Actions
                      </DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setEditingStudent(s)}>
                        <EditIcon /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => handleDelete(s._id)}
                      >
                        <Trash2Icon /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <UpdateDialog
        open={Boolean(editingStudent)}
        setOpen={(open) => {
          if (!open) {
            setEditingStudent(null);
          }
        }}
        initialValues={editingStudent ?? undefined}
        onSuccess={(updatedStudent) => {
          if (!updatedStudent) {
            return;
          }

          setStudents((prev) => prev.map((student) => (
            student._id === updatedStudent._id ? updatedStudent : student
          )));
        }}
      />
    </div>
  )
}
