import MetaMaskLogo from '../assets/metamask.svg'
import CondominiumLogo from '../assets/logo192.png'
import { useNavigate } from 'react-router'
import { doLogin } from '../services/Web3Service'
import { useState } from 'react'

export function Login() {
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  async function handleLogin() {
    try {
      await doLogin()
      navigate('/topics')
    } catch (e) {
      if (e instanceof Error) {
        setMessage(e.message)
      }
    }
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[url(https://images.unsplash.com/photo-1574362848149-11496d93a7c7?q=80&w=1984&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)] bg-cover bg-center">
      <div className="relative flex w-[400px] flex-col gap-4 rounded-lg bg-white p-4 text-center">
        <div className="-mt-8 rounded-lg bg-red-400 p-4">
          <strong className="text-2xl text-white">Condominium DAO</strong>
        </div>
        <div>
          <img
            src={CondominiumLogo}
            alt="Condominium logo"
            className="mx-auto"
          />
        </div>
        <button
          onClick={handleLogin}
          className="flex w-full cursor-pointer items-center justify-center gap-4 rounded-lg bg-red-400 p-4 transition hover:bg-red-500"
        >
          <img src={MetaMaskLogo} alt="MetaMask logo" className="size-8" />
          <span className="text-sm font-bold text-white uppercase">
            Sign-in with MetaMask
          </span>
        </button>
        <div className="py-4">
          {message && <p className="mb-4 text-sm text-red-400">{message}</p>}
          <p className="text-sm text-gray-600">
            Don't have an account? Ask to the{' '}
            <a
              href="mailto:mauricio.tp_@outlook.com"
              className="font-bold text-red-500 hover:text-red-600"
            >
              manager
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
