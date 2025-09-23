import { Input } from '../../components/Input'
import { SaveButton } from '../../components/SaveButton'
import { useNavigate, useParams } from 'react-router'
import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { Sidebar } from '../../components/Sidebar'
import { HiUsers } from 'react-icons/hi'
import { Footer } from '../../components/Footer'
import { FaSave } from 'react-icons/fa'
import { SwitchInput } from '../../components/SwitchButton'
import {
  addResident,
  doLogout,
  getResident,
  isManager,
  isResident,
  Resident,
  setCounselor,
} from '../../services/Web3Service'
import { Loader } from '../../components/Loader'

export function ResidentPage() {
  const navigate = useNavigate()

  let { wallet } = useParams()

  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [resident, setResident] = useState<Resident>({} as Resident)

  useEffect(() => {
    if (isResident()) {
      doLogout()
      navigate('/')
    }

    if (wallet) {
      setIsLoading(true)
      ;(async () => {
        try {
          const resident = await getResident(wallet)
          setResident(resident)
          setIsLoading(false)
        } catch (e) {
          setIsLoading(false)
          const err = e as Error
          setMessage(err.message)
        }
      })()
    }
  }, [wallet])

  function handleResidentChange(e: ChangeEvent<HTMLInputElement>) {
    setResident((prevState) => ({
      ...prevState,
      [e.target.id]: e.target.value,
    }))
  }

  async function handleFormSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (resident) {
      try {
        setMessage('Saving resident, please wait...')

        if (!wallet) {
          const transactionReceipt = await addResident(
            resident.wallet,
            resident.residence,
          )

          const transactionHash = transactionReceipt.transactionHash

          setMessage(
            `Resident saved! It may take some minutes to have effect. Transaction Hash: `,
          )
          navigate(`/residents?tx=${transactionHash}`)
        } else {
          const transactionReceipt = await setCounselor(
            resident.wallet,
            !!resident.isCounselor,
          )

          const transactionHash = transactionReceipt.transactionHash

          setMessage(
            `Resident saved! It may take some minutes to have effect. Transaction Hash: `,
          )
          navigate(`/residents?tx=${transactionHash}`)
        }
      } catch (err) {
        if (err instanceof Error) {
          setMessage(err.message)
        }
      }
    }
  }

  function getNextPayment() {
    const dateMs = resident.nextPayment * 1000

    if (!dateMs) return 'Never Payed'
    return new Date(dateMs).toDateString()
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="grow px-4 pt-6 pb-4">
        <main className="mb-4 rounded-lg p-4 shadow">
          <header>
            <h2 className="flex -translate-y-1/2 items-center gap-2 rounded-lg bg-red-400 p-4 font-bold text-white shadow">
              <HiUsers size={24} />
              New Resident
            </h2>
          </header>

          {isLoading ? <Loader /> : null}

          <form
            onSubmit={handleFormSubmit}
            className="flex max-w-1/2 flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <label htmlFor="wallet">Wallet Address</label>
              <Input
                type="text"
                id="wallet"
                placeholder="0x00..."
                value={resident.wallet || ''}
                onChange={handleResidentChange}
                disabled={!!wallet}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="residence">Residence Id (block+apartment)</label>
              <Input
                type="text"
                id="residence"
                placeholder="1101"
                value={resident.residence || ''}
                onChange={handleResidentChange}
                disabled={!!wallet}
              />
            </div>
            {wallet ? (
              <div className="flex flex-col gap-2">
                <label htmlFor="nextPayment">Next Payment</label>
                <Input
                  type="text"
                  id="nextPayment"
                  value={getNextPayment()}
                  disabled={true}
                />
              </div>
            ) : null}
            {isManager() && wallet ? (
              <div>
                <SwitchInput
                  id="isCounselor"
                  text="Is Counselor?"
                  isChecked={resident.isCounselor}
                  onChangeSwitchInputValue={handleResidentChange}
                />
              </div>
            ) : null}
            <div className="flex items-center gap-4">
              <SaveButton icon={FaSave}>Save Resident</SaveButton>
              <span className="text-red-500">{message}</span>
            </div>
          </form>
        </main>
        <Footer />
      </div>
    </div>
  )
}
