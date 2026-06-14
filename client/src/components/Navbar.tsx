import { clearAuthSession, useAuthSession } from "@/utils/auth"
import { BadgePlusIcon, CogIcon, LogInIcon, LogOutIcon } from "lucide-react"
import { Link, useNavigate } from "react-router"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

export const Navbar = () => {
  const authSession = useAuthSession();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  return (
    <header className="border-b border-accent px-5 py-2.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <p className="font-semibold tracking-wider">
          Student Management MERN
        </p>
        <nav className="flex items-center justify-center gap-5">
          <Tooltip>
            <TooltipTrigger asChild>
              {authSession
                ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="hover:text-destructive font-medium"
                  >
                    <LogOutIcon size={16} />
                  </button>
                )
                : (
                  <Link
                    to="/login"
                    className="hover:text-primary font-medium"
                  >
                    <LogInIcon size={16} />
                  </Link>
                )}
            </TooltipTrigger>
            <TooltipContent>
              {authSession ? "Logout" : "Login"}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/register"
                className="hover:text-primary font-medium"
              >
                <BadgePlusIcon size={16} />
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              Register
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/lists"
                className="hover:text-primary font-medium"
              >
                <CogIcon size={16} />
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              Student Lists
            </TooltipContent>
          </Tooltip>
        </nav>
      </div>
    </header>
  )
}
