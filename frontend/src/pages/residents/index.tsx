import { Footer } from '../../components/Footer'
import { Sidebar } from '../../components/Sidebar'
import { HiUsers } from 'react-icons/hi'
import { SaveButton } from '../../components/SaveButton'
import { FaPlus } from 'react-icons/fa'
import { Link, useNavigate } from 'react-router'
import { Alert } from '../../components/Alert'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { ResidentRow } from './ResidentRow'
import {
  getResidents,
  removeResident,
  Resident,
} from '../../services/Web3Service'
import { Loader } from '../../components/Loader'
import { Pagination } from '../../components/Pagination'

export function Residents() {
  const navigate = useNavigate()
  const [residents, setResidents] = useState<Resident[]>([])
  const [message, setMessage] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [count, setCount] = useState<number>(0)

  function useQuery() {
    return new URLSearchParams(useLocation().search)
  }

  const query = useQuery()

  useEffect(() => {
    ;(async () => {
      setIsLoading(true)
      try {
        const result = await getResidents(parseInt(query.get('page') || '1'))
        setResidents(result.residents)
        setCount(result.total)
        setIsLoading(false)
      } catch (e) {
        setIsLoading(false)
        const err = e as Error
        setError(err.message)
      }
    })()

    const tx = query.get('tx')
    if (tx) {
      setMessage(
        'Your transaction is being processed. It may take minutes to have effect.',
      )
    }
  }, [])

  function onDeleteResident(wallet: string) {
    ;(async () => {
      setIsLoading(true)
      setMessage('')
      setError('')
      try {
        const transactionReceipt = await removeResident(wallet)
        setIsLoading(false)
        navigate(`/residents?tx=${transactionReceipt.transactionHash}`)
      } catch (e) {
        setIsLoading(false)
        const err = e as Error
        setError(err.message)
      }
    })()
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="grow px-4 pt-6 pb-4">
        <main className="mb-4 rounded-lg p-4 shadow">
          <header>
            <h2 className="flex -translate-y-1/2 items-center gap-2 rounded-lg bg-red-400 p-4 font-bold text-white shadow">
              <HiUsers size={24} />
              Residents
            </h2>
          </header>

          {message ? <Alert message={message} type="success" /> : null}
          {error ? <Alert message={error} type="danger" /> : null}

          {isLoading && <Loader />}
          <div className="mt-2">
            <table className="mb-8 w-full text-left">
              <thead className="border-b border-b-gray-200 text-xs text-gray-400 uppercase">
                <tr className="[&>th]:pb-4">
                  <th>Wallet</th>
                  <th>Residence</th>
                  <th>Is Counselor?</th>
                  <th>Next Payment</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {residents && residents.length
                  ? residents.map((resident) => (
                      <ResidentRow
                        key={resident.wallet}
                        data={resident}
                        onDeleteResident={() =>
                          onDeleteResident(resident.wallet)
                        }
                      />
                    ))
                  : null}
              </tbody>
            </table>

            <Pagination count={count} pageSize={10} />

            <Link to="/residents/new" className="mt-4 inline-block">
              <SaveButton icon={FaPlus}>Add New Resident</SaveButton>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  )
}
