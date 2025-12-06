
import React from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface GenericTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  actions?: (item: T) => React.ReactNode;
}

function GenericTable<T extends { id: string | number }>({ data, columns, onRowClick, actions }: GenericTableProps<T>) {
  const renderCell = (item: T, col: Column<T>) => {
    if (typeof col.accessor === 'function') {
      return col.accessor(item);
    }
    // Safely access the property and cast to ReactNode compatible type
    const value = item[col.accessor];
    if (value === null || value === undefined) return '';
    return value as unknown as React.ReactNode;
  };

  return (
    <div className="overflow-hidden bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50/80 backdrop-blur-sm">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  scope="col"
                  className={`px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
              {actions && (
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Thao tác
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {data.length > 0 ? (
              data.map((item) => (
                <tr 
                  key={item.id} 
                  className={`hover:bg-teal-50/30 transition-colors duration-150 ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick && onRowClick(item)}
                >
                  {columns.map((col, idx) => (
                    <td key={idx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {renderCell(item, col)}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {actions(item)}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-12 text-center text-gray-500 text-sm flex flex-col items-center justify-center">
                   <div className="bg-gray-50 p-4 rounded-full mb-3">
                      <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                   </div>
                   Không có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default GenericTable;
