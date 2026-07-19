import { forwardRef } from 'react';

const Dropdown = forwardRef(function Dropdown({ className = '', children, ...props }, ref) {
  return <select ref={ref} className={`theme-input cursor-pointer appearance-none pr-9 ${className}`} {...props}>{children}</select>;
});

export default Dropdown;
