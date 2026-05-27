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
import { EyeClosedIcon, EyeIcon, Loader2Icon, LogInIcon } from "lucide-react"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group"

const formSchema = z.object({
  email: z.email(""),
  password: z.string().min(8, "Password is too short"),
});

type LoginFormValues = z.infer<typeof formSchema>
type EncryptedStudentResponse = {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  courseEnrolled?: string;
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    }
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);

    try {
      const resp = await api.post("/login", {
        json: await encryptRequestPayload(data),
      });

      if (resp.ok) {
        const { fullName } = await decryptStudentPayload(await resp.json<EncryptedStudentResponse>());
        toast.success(`Welcome back, ${fullName ?? "Student"}!`);
        form.reset();
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
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="login-form" onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="login-form-email">
                      Email
                    </FieldLabel>
                    <Input
                      {...field}
                      id="login-form-email"
                      aria-invalid={fieldState.invalid}
                      placeholder="email@example.com"
                      autoComplete="off"
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
                    <FieldLabel htmlFor="login-form-password">
                      Password
                    </FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        {...field}
                        id="login-form-password"
                        aria-invalid={fieldState.invalid}
                        type={showPassword ? "text" : "password"}
                        placeholder={showPassword ? "Password" : "●●●●●●●●"}
                        autoComplete="off"
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
              form="login-form"
              disabled={loading}
            >
              {loading
                ? <Loader2Icon className="animate-spin" />
                : <LogInIcon />
              }
              Log In
            </Button>
          </Field>
        </CardFooter>
      </Card>
    </div>
  )
}
