import { useState } from 'react'
import { FaThumbsDown, FaThumbsUp, FaX } from 'react-icons/fa6'

interface AlertProps {
  type: 'success' | 'danger'
  message: string
}

export function Alert({ type, message }: AlertProps) {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-lg ${type === 'success' ? 'bg-green-600' : 'bg-red-500'} p-4 text-white`}
    >
      <div className="flex items-center gap-2">
        {type === 'success' ? (
          <FaThumbsUp size={18} />
        ) : (
          <FaThumbsDown size={18} />
        )}
        <p>
          <span className="font-bold">
            {type === 'success' ? 'Success!' : 'Error!'}
          </span>{' '}
          {message}
        </p>
      </div>
      <button
        className={`cursor-pointer rounded-sm p-1 ring-1 ring-transparent transition ${type === 'success' ? 'hover:ring-green-200' : 'hover:ring-red-200'}`}
        onClick={() => setVisible(false)}
        aria-label="Fechar alerta"
      >
        <FaX size={14} />
      </button>
    </div>
  )
}
