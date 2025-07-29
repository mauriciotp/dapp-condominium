import { ButtonHTMLAttributes } from 'react'
import { IconType } from 'react-icons'

interface SaveButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  icon: IconType
}

export function SaveButton({
  children,
  icon: Icon,
  ...props
}: SaveButtonProps) {
  return (
    <button
      type="submit"
      className="flex w-fit shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-black px-4 py-2 font-bold text-white uppercase"
      {...props}
    >
      <Icon size={18} />
      <span className="text-sm">{children}</span>
    </button>
  )
}
