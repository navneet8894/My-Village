export function Table({ className = '', children, ...props }) {
  return <div className="overflow-x-auto rounded-xl border border-line bg-card"><table className={`w-full text-sm ${className}`} {...props}>{children}</table></div>;
}

export function TableHead({ className = '', ...props }) { return <thead className={`border-b border-line bg-soft text-left text-text ${className}`} {...props} />; }
export function TableBody({ className = '', ...props }) { return <tbody className={`divide-y divide-line ${className}`} {...props} />; }
export function TableRow({ className = '', ...props }) { return <tr className={`transition hover:bg-soft ${className}`} {...props} />; }
export function TableHeader({ className = '', ...props }) { return <th className={`px-4 py-3 font-semibold ${className}`} {...props} />; }
export function TableCell({ className = '', ...props }) { return <td className={`px-4 py-3 ${className}`} {...props} />; }
