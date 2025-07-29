import { Link, LinkProps, useLocation } from 'react-router'

interface SidebarLinkProps extends LinkProps {
  children: React.ReactNode
}

export function SidebarLink({ children, to, ...props }: SidebarLinkProps) {
  const location = useLocation()

  const isActive = location.pathname === to

  return (
    <Link
      className={`flex items-center gap-2 rounded-lg px-3 py-4 text-sm ${isActive ? 'bg-red-400' : 'hover:bg-red-400'}`}
      to={to}
      {...props}
    >
      {children}
    </Link>
  )
}
