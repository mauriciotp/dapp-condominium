import { InputHTMLAttributes } from 'react'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="rounded border border-gray-200 px-3 py-2 outline-0"
      {...props}
    />
  )
}
