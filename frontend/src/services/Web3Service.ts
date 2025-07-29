import 'viem/window'
import {
  createPublicClient,
  createWalletClient,
  custom,
  getContract,
} from 'viem'
import { sepolia } from 'viem/chains'
import { abi } from './abi'

const ADAPTER_ADDRESS = import.meta.env.VITE_ADAPTER_ADDRESS as `0x${string}`

export type Resident = {
  wallet: string
  isCounselor: boolean
  isManager: boolean
  residence: number
  nextPayment: number
}

export enum Profile {
  RESIDENT = 0,
  COUNSELOR = 1,
  MANAGER = 2,
}

function getProfile(): Profile {
  const profile = localStorage.getItem('profile') || '0'

  return parseInt(profile)
}

const client = createWalletClient({
  chain: sepolia,
  transport: custom(window.ethereum!),
})

const publicClient = createPublicClient({
  chain: sepolia,
  transport: custom(window.ethereum!),
})

const contract = getContract({
  abi,
  address: ADAPTER_ADDRESS,
  client,
})

export type LoginResult = {
  account: string
  profile: Profile
}

export function isManager() {
  return parseInt(localStorage.getItem('profile') || '0') === Profile.MANAGER
}

export async function doLogin(): Promise<LoginResult> {
  const accounts = await client.requestAddresses()

  if (!accounts || !accounts.length)
    throw new Error('Wallet not found/allowed.')

  const resident = await contract.read.getResident([accounts[0]])
  let isManager = resident.isManager

  if (!isManager && resident.residence > 0) {
    if (resident.isCounselor)
      localStorage.setItem('profile', `${Profile.COUNSELOR}`)
    else localStorage.setItem('profile', `${Profile.RESIDENT}`)
  } else if (!isManager && !resident.residence) {
    const manager = await contract.read.getManager()
    isManager = accounts[0] === manager
  }

  if (isManager) localStorage.setItem('profile', `${Profile.MANAGER}`)
  else if (localStorage.getItem('profile') === null)
    throw new Error('Unauthorized')

  localStorage.setItem('account', accounts[0])

  return {
    account: accounts[0],
    profile: parseInt(localStorage.getItem('profile') || '0'),
  }
}

export function doLogout() {
  localStorage.removeItem('account')
  localStorage.removeItem('profile')
}

export async function getAddress() {
  const address = await contract.read.getImplementationAddress()

  return address
}

// address: 0x02249Cd2164Cd0be2A932F686F9907B604da32D9
export async function upgrade(address: string) {
  if (getProfile() !== Profile.MANAGER)
    throw new Error('You do not have permission.')

  const account = localStorage.getItem('account') as `0x${string}`

  const hash = await contract.write.upgrade([address as `0x${string}`], {
    account,
  })

  const transactionReceipt = await publicClient.waitForTransactionReceipt({
    hash,
  })

  return transactionReceipt
}

export async function addResident(wallet: string, residenceId: number) {
  if (getProfile() === Profile.RESIDENT)
    throw new Error('You do not have permission.')

  const account = localStorage.getItem('account') as `0x${string}`

  const hash = await contract.write.addResident(
    [wallet as `0x${string}`, residenceId],
    {
      account,
    },
  )

  const transactionReceipt = await publicClient.waitForTransactionReceipt({
    hash,
  })

  return transactionReceipt
}
