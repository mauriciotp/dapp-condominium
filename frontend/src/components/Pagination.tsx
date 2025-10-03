import { Link, useLocation } from 'react-router'

type PaginationProps = {
  count: number
  pageSize: number
}

export function Pagination({ count, pageSize }: PaginationProps) {
  function useQuery() {
    return new URLSearchParams(useLocation().search)
  }

  const query = useQuery()

  function getPageLink(page: number) {
    return `${window.location.pathname}?page=${page}`
  }

  function getActivePageClass(page: number) {
    const queryPage = parseInt(query.get('page') || '1')
    const isActive = queryPage === page || (!queryPage && page === 1)

    return isActive ? 'bg-blue-500' : 'bg-gray-200'
  }

  function getBottom() {
    if (count > 0) {
      return (
        <div className="text-sm">
          <b>{count}</b> result(s).
        </div>
      )
    } else {
      return (
        <div className="text-sm">
          <b>No results found!</b> Create one first.
        </div>
      )
    }
  }

  const pagesQty = Math.ceil(count / pageSize)
  const pages = []

  for (let i = 1; i <= pagesQty; i++) {
    pages.push(i)
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <nav>
        <ul>
          {pages && pages.length
            ? pages.map((page) => (
                <li key={page}>
                  <Link
                    to={getPageLink(page)}
                    className={`flex size-3 items-center justify-center rounded-full p-4 shadow-lg ${getActivePageClass(page)}`}
                  >
                    {page}
                  </Link>
                </li>
              ))
            : null}
        </ul>
      </nav>
      {getBottom()}
    </div>
  )
}
