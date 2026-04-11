import * as React from 'react'

interface Column<T> {
  key: keyof T | string
  header: string
  cell?: (item: T) => React.ReactNode
  sortable?: boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onRowClick?: (item: T) => void
  selectable?: boolean
}

export function DataTable<T extends { _id: string }>({
  data,
  columns,
  onRowClick,
  selectable = false,
}: DataTableProps<T>) {
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set())

  const toggleRow = (id: string) => {
    const newSelection = new Set(selectedRows)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedRows(newSelection)
  }

  const toggleAll = () => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(data.map((item) => item._id)))
    }
  }

  const renderCell = (column: Column<T>, item: T) => {
    if (column.cell) {
      return column.cell(item)
    }

    const value = item[column.key as keyof T]
    return <span>{String(value ?? '')}</span>
  }

  return (
    <div className="rounded-md border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              {selectable && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === data.length && data.length > 0}
                    onChange={toggleAll}
                    className="rounded"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th key={String(column.key)} className="px-4 py-3 text-left text-sm font-semibold">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={item._id}
                className={`border-b transition-colors ${
                  onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''
                } ${selectedRows.has(item._id) ? 'bg-muted/30' : ''}`}
                onClick={() => onRowClick?.(item)}
              >
                {selectable && (
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(item._id)}
                      onChange={() => toggleRow(item._id)}
                      className="rounded"
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td key={String(column.key)} className="px-4 py-3 text-sm">
                    {renderCell(column, item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No data available</p>
        </div>
      )}
    </div>
  )
}
