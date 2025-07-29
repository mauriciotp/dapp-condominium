import { ChangeEvent, ChangeEventHandler, InputHTMLAttributes } from 'react'

interface SwitchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  text: string
  isChecked: boolean
  onChangeSwitchInputValue: ChangeEventHandler<HTMLInputElement>
}

export function SwitchInput({
  text,
  id,
  isChecked,
  onChangeSwitchInputValue,
  ...props
}: SwitchInputProps) {
  function handleSwitchInputChange(e: ChangeEvent<HTMLInputElement>) {
    const isChecked = e.target.value === 'true'
    e.target.value = `${!isChecked}`
    onChangeSwitchInputValue(e)
  }

  function getIsChecked() {
    if (typeof isChecked === 'string') {
      return isChecked === 'true'
    } else {
      return isChecked
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        className="cursor-pointer"
        type="checkbox"
        id={id}
        onChange={handleSwitchInputChange}
        checked={getIsChecked() || false}
        {...props}
      />
      <label className="cursor-pointer" htmlFor={id}>
        {text}
      </label>
    </div>
  )
}
