import React from 'react';

export const StatBox = ({ label, value, subValue, className }: { label: string; value: string | number; subValue?: string; className?: string }) => (
    <div className={`flex flex-col items-center justify-center p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-center ${className}`}>
        <span className="text-2xl sm:text-3xl font-bold font-mono text-white">{value}</span>
        <span className="text-xs uppercase tracking-wider text-zinc-400 mt-1">{label}</span>
        {subValue && <span className="text-xs text-zinc-500">{subValue}</span>}
    </div>
);