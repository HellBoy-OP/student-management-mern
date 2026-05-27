import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { api } from "@/utils/api"
import { cn } from "@/utils/cn"
import { decryptStudentPayload, encryptRequestPayload } from "@/utils/crypto"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  EyeClosedIcon,
  EyeIcon,
  Loader2Icon,
  SaveIcon,
  UserRoundPlusIcon
} from "lucide-react"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput
} from "./ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "./ui/select"
import { Textarea } from "./ui/textarea"

const studentFieldsSchema = z.object({
  email: z.email(),
  fullName: z.string().min(1, "Full name is required."),
  phoneNumber: z.string().min(1, "Phone number is required."),
  dateOfBirth: z.string("Select a date").min(1, "Date of birth is required."),
  gender: z.enum(["male", "female", "other"], "Please select a gender."),
  address: z.string().min(1, "Address is required."),
  courseEnrolled: z.string().min(1, "Course is required."),
});

const createFormSchema = studentFieldsSchema.extend({
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const updateFormSchema = studentFieldsSchema.extend({
  password: z.union([
    z.literal(""),
    z.string().min(8, "Password must be at least 8 characters."),
  ]),
});

type StudentFormValues = z.infer<typeof createFormSchema>

export type StudentFormInitialValues = Omit<StudentFormValues, "password"> & {
  _id: string;
  password?: string;
}

type StudentFormProps = React.ComponentProps<"div"> & {
  initialValues?: StudentFormInitialValues;
  onSuccess?: (student?: StudentFormInitialValues) => void;
}

const emptyFormValues: StudentFormValues = {
  email: "",
  fullName: "",
  phoneNumber: "",
  dateOfBirth: "",
  gender: undefined as unknown as StudentFormValues["gender"],
  address: "",
  courseEnrolled: "",
  password: "",
};

const toDateInputValue = (value: string): string => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  if (value.includes("T")) {
    return value.slice(0, 10);
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? value : date.toISOString().slice(0, 10);
};

const getFormValues = (
  initialValues?: StudentFormInitialValues,
): StudentFormValues => {
  if (!initialValues) {
    return emptyFormValues;
  }

  return {
    email: initialValues.email,
    fullName: initialValues.fullName,
    phoneNumber: initialValues.phoneNumber,
    dateOfBirth: toDateInputValue(initialValues.dateOfBirth),
    gender: initialValues.gender,
    address: initialValues.address,
    courseEnrolled: initialValues.courseEnrolled,
    password: initialValues.password ?? "",
  };
};

export function StudentForm({
  initialValues,
  onSuccess,
  className,
  ...props
}: StudentFormProps) {
  const isEditing = Boolean(initialValues?._id);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(isEditing ? updateFormSchema : createFormSchema),
    defaultValues: getFormValues(initialValues),
  });

  useEffect(() => {
    form.reset(getFormValues(initialValues));
  }, [form, initialValues]);

  const onSubmit = async (data: StudentFormValues) => {
    setLoading(true);

    try {
      const payload = {
        ...data,
        ...(isEditing && data.password.length === 0 ? { password: undefined } : {}),
      };
      const encryptedPayload = await encryptRequestPayload(payload);
      const resp = isEditing
        ? await api.put(`/student/${initialValues?._id}`, { json: encryptedPayload })
        : await api.post("/register", { json: encryptedPayload });

      if (resp.ok) {
        toast.success(isEditing ? "Updated" : "Registered");

        if (isEditing) {
          const updatedStudent = await decryptStudentPayload(
            await resp.json<StudentFormInitialValues>(),
          );

          onSuccess?.(updatedStudent);
        } else {
          form.reset();
          onSuccess?.();
        }
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Unexpected error";
      toast.error(errMsg);
    }

    setLoading(false);
  }

  return (
    <div className={cn("flex flex-col gap-6 max-w-md mx-auto w-full py-10", className)} {...props}>
      <Card>
        {!isEditing && (
          <CardHeader>
            <CardTitle>Student Registration</CardTitle>
            <CardDescription>
              Add a new student record with the full details below.
            </CardDescription>
          </CardHeader>
        )}
        <CardContent>
          <form id="student-form" onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Controller
                name="fullName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="student-form-fullName">
                      Full name
                    </FieldLabel>
                    <Input
                      {...field}
                      id="student-form-fullName"
                      aria-invalid={fieldState.invalid}
                      placeholder="John Doe"
                      autoComplete="name"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="student-form-email">
                      Email
                    </FieldLabel>
                    <Input
                      {...field}
                      id="student-form-email"
                      aria-invalid={fieldState.invalid}
                      placeholder="email@example.com"
                      autoComplete="email"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="phoneNumber"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="student-form-phoneNumber">
                      Phone number
                    </FieldLabel>
                    <Input
                      {...field}
                      id="student-form-phoneNumber"
                      aria-invalid={fieldState.invalid}
                      placeholder="+91 XXXXXXXXXX"
                      autoComplete="tel"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="dateOfBirth"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="student-form-dateOfBirth">
                      Date of birth
                    </FieldLabel>
                    <Input
                      {...field}
                      id="student-form-dateOfBirth"
                      aria-invalid={fieldState.invalid}
                      type="date"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="gender"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="student-form-gender">
                      Gender
                    </FieldLabel>
                    <Select
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="student-form-gender"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="address"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="student-form-address">
                      Address
                    </FieldLabel>
                    <Textarea
                      {...field}
                      id="student-form-address"
                      aria-invalid={fieldState.invalid}
                      placeholder="123 Main St, Delhi, India"
                      className="resize-none h-20"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="courseEnrolled"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="student-form-courseEnrolled">
                      Course enrolled
                    </FieldLabel>
                    <Input
                      {...field}
                      id="student-form-courseEnrolled"
                      aria-invalid={fieldState.invalid}
                      placeholder="Computer Science"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="student-form-password">
                      Password
                    </FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        {...field}
                        id="student-form-password"
                        aria-invalid={fieldState.invalid}
                        type={showPassword ? "text" : "password"}
                        placeholder={showPassword ? "Password" : "●●●●●●●●"}
                        autoComplete={isEditing ? "off" : "new-password"}
                      />
                      <InputGroupAddon
                        align="inline-end"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="cursor-pointer"
                      >
                        {!showPassword
                          ? <EyeClosedIcon />
                          : <EyeIcon />
                        }
                      </InputGroupAddon>
                    </InputGroup>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter>
          <Field>
            <Button
              type="submit"
              form="student-form"
              disabled={loading}
            >
              {loading
                ? <Loader2Icon className="animate-spin" />
                : isEditing ? <SaveIcon /> : <UserRoundPlusIcon />
              }
              {isEditing ? "Update" : "Register"}
            </Button>
          </Field>
        </CardFooter>
      </Card>
    </div>
  )
}
