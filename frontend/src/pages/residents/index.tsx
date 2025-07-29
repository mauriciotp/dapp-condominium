import { Footer } from '../../components/Footer'
import { Sidebar } from '../../components/Sidebar'
import { HiUsers } from 'react-icons/hi'
import { SaveButton } from '../../components/SaveButton'
import { FaPlus } from 'react-icons/fa'
import { Link } from 'react-router'

export function Residents() {
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

          <div>
            <table>Users table</table>
            <Link to="/residents/new">
              <SaveButton icon={FaPlus}>Add New Resident</SaveButton>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  )
}
