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

export function isResident() {
  return parseInt(localStorage.getItem('profile') || '0') === Profile.RESIDENT
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

export async function removeResident(wallet: string) {
  if (getProfile() !== Profile.MANAGER)
    throw new Error('You do not have permission.')

  const account = localStorage.getItem('account') as `0x${string}`

  const hash = await contract.write.removeResident([wallet as `0x${string}`], {
    account,
  })

  const transactionReceipt = await publicClient.waitForTransactionReceipt({
    hash,
  })

  return transactionReceipt
}

export async function setCounselor(wallet: string, isEntering: boolean) {
  if (getProfile() !== Profile.MANAGER)
    throw new Error('You do not have permission.')

  const account = localStorage.getItem('account') as `0x${string}`

  const hash = await contract.write.setCounselor(
    [wallet as `0x${string}`, isEntering],
    {
      account,
    },
  )

  const transactionReceipt = await publicClient.waitForTransactionReceipt({
    hash,
  })

  return transactionReceipt
}

export async function getResident(wallet: string) {
  const result = await contract.read.getResident([wallet as `0x${string}`])

  return {
    wallet: result.wallet,
    residence: result.residence,
    isCounselor: result.isCounselor,
    isManager: result.isManager,
    nextPayment: Number(result.nextPayment),
  } as Resident
}

export type ResidentPage = {
  residents: Resident[]
  total: number
}

export async function getResidents(page: number = 1, pageSize: number = 10) {
  const result = await contract.read.getResidents([
    BigInt(page),
    BigInt(pageSize),
  ])

  const residents: Resident[] = result.residents
    .filter((r) => r.residence)
    .sort((a, b) => {
      if (a.residence > b.residence) return 1
      return -1
    })
    .map((resident) => {
      return {
        wallet: resident.wallet,
        residence: Number(resident.residence),
        isCounselor: resident.isCounselor,
        isManager: resident.isManager,
        nextPayment: Number(resident.nextPayment),
      }
    })

  return {
    residents,
    total: Number(result.total),
  } as ResidentPage
}
