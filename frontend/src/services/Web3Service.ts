import 'viem/window'
import { createWalletClient, custom, getContract } from 'viem'
import { sepolia } from 'viem/chains'
import { abi } from './abi'

const ADAPTER_ADDRESS = import.meta.env.VITE_ADAPTER_ADDRESS as `0x${string}`

export enum Profile {
  RESIDENT = 0,
  COUNSELOR = 1,
  MANAGER = 2,
}

const client = createWalletClient({
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

export async function doLogin(): Promise<LoginResult> {
  const accounts = await client.requestAddresses()

  if (!accounts || !accounts.length)
    throw new Error('Wallet not found/allowed.')

  const manager = await contract.read.getManager()
  const isManager = manager === accounts[0]

  if (isManager) localStorage.setItem('profile', `${Profile.MANAGER}`)
  else localStorage.setItem('profile', `${Profile.RESIDENT}`)

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
