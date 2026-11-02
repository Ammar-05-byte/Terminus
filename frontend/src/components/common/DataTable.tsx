import { ReactNode } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField?: keyof T | ((row: T, index: number) => string | number);
  isLoading?: boolean;
  emptyMessage?: string;
  emptyTitle?: string;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyField,
  isLoading = false,
  emptyMessage = 'No records found',
  emptyTitle = 'No data available',
  className = '',
}: DataTableProps<T>) {
  if (isLoading) {
    return <LoadingSpinner size="md" message="Loading records..." />;
  }

  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />;
  }

  const getKey = (row: T, index: number): string | number => {
    if (typeof keyField === 'function') {
      return keyField(row, index);
    }
    if (keyField && (row as any)[keyField] !== undefined) {
      return (row as any)[keyField];
    }
    return index;
  };

  return (
    <div className={`overflow-x-auto rounded-xl border border-slate-200 bg-white ${className}`}>
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50/80 font-medium text-slate-600">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`px-4 py-3.5 text-xs font-semibold uppercase tracking-wider ${
                  col.headerClassName || ''
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {data.map((row, idx) => (
            <tr
              key={getKey(row, idx)}
              className="hover:bg-slate-50/70 transition-colors"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3 text-slate-700 whitespace-nowrap ${
                    col.className || ''
                  }`}
                >
                  {col.render
                    ? col.render(row, idx)
                    : ((row as any)[col.key] !== undefined && (row as any)[col.key] !== null)
                    ? String((row as any)[col.key])
                    : '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
