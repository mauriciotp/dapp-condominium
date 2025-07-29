import { RiSettings3Fill } from 'react-icons/ri'
import { Sidebar } from '../components/Sidebar'
import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { getAddress, upgrade } from '../services/Web3Service'
import { BsHourglassSplit } from 'react-icons/bs'
import { Footer } from '../components/Footer'
import { Input } from '../components/Input'
import { SaveButton } from '../components/SaveButton'
import { FaSave } from 'react-icons/fa'

export function Settings() {
  const [contractAddress, setContractAddress] = useState<string>('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    async function loadAddress() {
      try {
        setIsLoading(true)

        const address = await getAddress()
        setContractAddress(address)

        setIsLoading(false)
      } catch (err) {
        if (err instanceof Error) {
          setMessage(err.message)
          setIsLoading(false)
        }
      }
    }

    loadAddress()
  }, [])

  function handleChangeContractAddress(e: ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value

    setContractAddress(newValue)
  }

  async function handleFormSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    try {
      setMessage('Saving data, please wait...')
      const transactionReceipt = await upgrade(contractAddress)
      setMessage(
        `Settings saved! It may take some minutes to have effect. Transaction Hash: ${transactionReceipt.transactionHash}`,
      )
    } catch (err) {
      if (err instanceof Error) {
        setMessage(err.message)
      }
    }
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="grow px-4 pt-6 pb-4">
        <main className="mb-4 rounded-lg p-4 shadow">
          <header>
            <h2 className="flex -translate-y-1/2 items-center gap-2 rounded-lg bg-red-400 p-4 font-bold text-white shadow">
              <RiSettings3Fill size={24} />
              Settings
            </h2>
          </header>

          <form
            onSubmit={handleFormSubmit}
            className="flex max-w-1/2 flex-col gap-4 [&>div]:not-last:flex [&>div]:not-last:flex-col [&>div]:not-last:gap-2"
          >
            {isLoading && (
              <div>
                <p className="flex items-center gap-2">
                  <BsHourglassSplit size={18} />
                  Loading...
                </p>
              </div>
            )}
            <div>
              <label htmlFor="adapter">Adapter Address</label>
              <input
                type="text"
                id="adapter"
                disabled
                value={import.meta.env.VITE_ADAPTER_ADDRESS}
                className="rounded bg-gray-200 px-3 py-2 outline-0"
              />
            </div>
            <div>
              <label htmlFor="contract">Contract Address</label>
              <Input
                type="text"
                id="contract"
                onChange={handleChangeContractAddress}
                value={contractAddress}
              />
            </div>
            <div className="flex items-center gap-4">
              <SaveButton icon={FaSave}>Save Settings</SaveButton>
              <span className="text-red-500">{message}</span>
            </div>
          </form>
        </main>
        <Footer />
      </div>
    </div>
  )
}
