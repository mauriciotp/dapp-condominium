import CondominiumLogo from '../assets/logo192.png'
import { MdSpaceDashboard } from 'react-icons/md'
import { SidebarLink } from './SidebarLink'
import { HiUsers } from 'react-icons/hi'
import { FaMoneyBills, FaMoneyBillTransfer } from 'react-icons/fa6'
import { RiSettings3Fill } from 'react-icons/ri'
import { doLogout, Profile } from '../services/Web3Service'
import { useNavigate } from 'react-router'
import { useEffect, useState } from 'react'

export function Sidebar() {
  const [currentUser, setCurrentUser] = useState<Profile>(Profile.RESIDENT)

  useEffect(() => {
    const user = parseInt(localStorage.getItem('profile') || '0')

    setCurrentUser(user)
  }, [])

  const navigate = useNavigate()

  function handleLogout() {
    doLogout()
    navigate('/')
  }

  return (
    <aside className="flex h-screen w-[240px] flex-col bg-gray-800 p-4 text-gray-100">
      <header className="mb-2 border-b border-gray-600 pb-4">
        <div className="flex items-center gap-2 px-3">
          <img
            src={CondominiumLogo}
            alt="Condominium Logo"
            className="size-8"
          />
          <strong>Condominium</strong>
        </div>
      </header>
      <div className="grow">
        <ul className="flex flex-col gap-2">
          <li>
            <SidebarLink to="/topics">
              <MdSpaceDashboard size={24} />
              Topics
            </SidebarLink>
          </li>
          {currentUser !== Profile.RESIDENT ? (
            <li>
              <SidebarLink to="/residents">
                <HiUsers size={24} />
                Residents
              </SidebarLink>
            </li>
          ) : null}
          {currentUser !== Profile.MANAGER ? (
            <li>
              <SidebarLink to="/quota">
                <FaMoneyBills size={24} />
                Quota
              </SidebarLink>
            </li>
          ) : null}
          {currentUser === Profile.MANAGER ? (
            <>
              <li>
                <SidebarLink to="/transfer">
                  <FaMoneyBillTransfer size={24} />
                  Transfer
                </SidebarLink>
              </li>
              <li>
                <SidebarLink to="/settings">
                  <RiSettings3Fill size={24} />
                  Settings
                </SidebarLink>
              </li>
            </>
          ) : null}
        </ul>
      </div>
      <footer>
        <button
          onClick={handleLogout}
          className="w-full cursor-pointer rounded-lg bg-red-400 px-3 py-4 text-sm font-bold uppercase transition hover:bg-red-500"
        >
          Logout
        </button>
      </footer>
    </aside>
  )
}
