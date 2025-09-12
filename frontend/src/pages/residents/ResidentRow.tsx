import { IoPencil, IoTrash } from 'react-icons/io5'
import { Resident, isManager } from '../../services/Web3Service'
import { Link } from 'react-router'

type ResidentRowProps = {
  data: Resident
  onDeleteResident: (wallet: string) => void
}

export function ResidentRow({ data, onDeleteResident }: ResidentRowProps) {
  function getNextPayment() {
    const dateMs = data.nextPayment * 1000

    const text = !dateMs ? 'Never Payed' : new Date(dateMs).toDateString()
    let color = 'text-green-400'

    if (!dateMs || dateMs < Date.now()) {
      color = 'text-red-400'
    }

    return <td className={`text-sm ${color}`}>{text}</td>
  }

  function handleDeleteResident() {
    if (window.confirm('Are you sure to delete this resident?')) {
      onDeleteResident(data.wallet)
    }
  }

  return (
    <tr className="[&>td]:py-4">
      <td>{data.wallet}</td>
      <td className="text-sm text-gray-600">{Number(data.residence)}</td>
      <td className="text-sm text-gray-600">
        {JSON.stringify(data.isCounselor)}
      </td>
      {getNextPayment()}
      {isManager() ? (
        <td className="flex items-center gap-1">
          <Link
            className="cursor-pointer rounded-sm bg-blue-500 px-2 py-1"
            to={`/residents/edit/${data.wallet}`}
          >
            <IoPencil className="text-white" />
          </Link>
          <button
            className="cursor-pointer rounded-sm bg-red-400 px-2 py-1"
            onClick={handleDeleteResident}
          >
            <IoTrash className="text-white" />
          </button>
        </td>
      ) : null}
    </tr>
  )
}
