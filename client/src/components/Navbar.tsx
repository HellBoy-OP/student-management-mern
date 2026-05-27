import { BadgePlusIcon, CogIcon, LogInIcon } from "lucide-react"
import { Link } from "react-router"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

export const Navbar = () => {
  return (
    <header className="border-b border-accent px-5 py-2.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <p className="font-semibold tracking-wider">
          Student Management MERN
        </p>
        <nav className="flex items-center justify-center gap-5">
          <Tooltip>
            <TooltipTrigger>
              <Link
                to="/login"
                className="hover:text-primary font-medium"
              >
                <LogInIcon size={16} />
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              Login
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
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
            <TooltipTrigger>
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
