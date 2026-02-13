import React from 'react';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
    return (
        <div
            className={clsx("bg-white rounded-xl shadow-sm border border-slate-100", className)}
            {...props}
        >
            {children}
        </div>
    );
};
