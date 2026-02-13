import React from 'react';

export interface TableColumn<T> {
    header: string;
    accessor?: keyof T | ((row: T) => any);
    render?: (value: any, row: T) => React.ReactNode;
    className?: string;
}

interface TableProps<T> {
    data: T[];
    columns: TableColumn<T>[];
    loading?: boolean;
    actions?: (item: T) => React.ReactNode;
}

export const Table = <T extends { id: number | string }>({ data, columns, loading, actions }: TableProps<T>) => {
    if (loading) {
        return (
            <div className="w-full h-48 flex items-center justify-center bg-white rounded-xl border border-slate-200">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                    <tr>
                        {columns.map((col, idx) => (
                            <th key={idx} className={`px-6 py-3 font-medium ${col.className || ''}`}>
                                {col.header}
                            </th>
                        ))}
                        {actions && <th className="px-6 py-3 font-medium text-right">Acciones</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                    {data.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                            {columns.map((col, idx) => {
                                const value = typeof col.accessor === 'function'
                                    ? (col.accessor as Function)(item)
                                    : (col.accessor ? item[col.accessor as keyof T] : undefined);
                                return (
                                    <td key={idx} className={`px-6 py-4 text-slate-700 ${col.className || ''}`}>
                                        {col.render ? col.render(value, item) : (value as React.ReactNode)}
                                    </td>
                                );
                            })}
                            {actions && (
                                <td className="px-6 py-4 text-right">
                                    {actions(item)}
                                </td>
                            )}
                        </tr>
                    ))}
                    {data.length === 0 && (
                        <tr>
                            <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-12 text-center text-slate-400">
                                No hay datos disponibles
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};
