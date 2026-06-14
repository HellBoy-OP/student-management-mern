import { clearAuthSession, useAuthSession } from "@/utils/auth"
import { Link, useNavigate } from "react-router"
import { Button } from "./ui/button"

export const Home = () => {
  const authSession = useAuthSession();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  return (
    <div className="max-w-4xl mx-auto p-5 space-y-10">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Welcome to the Student Management App</h1>
        <p className="text-muted-foreground">
          Manage student records efficiently with our intuitive interface.
        </p>
      </div>
      <div className="flex items-center justify-center gap-4">
        {authSession
          ? <Button onClick={handleLogout}>Logout</Button>
          : (
            <Link to="/login">
              <Button>Login Page</Button>
            </Link>
          )}
        <Link to="/register">
          <Button>Register Page</Button>
        </Link>
        <Link to="/lists">
          <Button>Student Lists</Button>
        </Link>
      </div>
    </div>
  )
}
