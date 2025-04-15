import { Link, LinkProps } from 'react-router'

interface SidebarLinkProps extends LinkProps {
  children: React.ReactNode
  active?: boolean
}

export function SidebarLink({
  children,
  active = false,
  ...props
}: SidebarLinkProps) {
  return (
    <Link
      className={`flex items-center gap-2 rounded-lg px-3 py-4 text-sm ${active ? 'bg-red-400' : 'hover:bg-red-400'}`}
      {...props}
    >
      {children}
    </Link>
  )
}
