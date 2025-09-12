import { BsHourglassSplit } from 'react-icons/bs'

export function Loader() {
  return (
    <div>
      <p className="flex items-center gap-2">
        <BsHourglassSplit size={18} />
        Loading...
      </p>
    </div>
  )
}
