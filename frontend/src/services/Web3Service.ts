import { createWalletClient, custom } from 'viem'
import { sepolia } from 'viem/chains'
import 'viem/window'

export const client = createWalletClient({
  chain: sepolia,
  transport: custom(window.ethereum!),
})

export async function doLogin() {
  const accounts = await client.requestAddresses()

  if (!accounts || !accounts.length)
    throw new Error('Wallet not found/allowed.')

  localStorage.setItem('account', accounts[0])

  return accounts[0]
}
