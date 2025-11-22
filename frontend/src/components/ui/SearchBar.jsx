import { useState, useEffect } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

const SearchBar = ({ onSearch, placeholder = 'Search...', className = '', debounceMs = 200 }) => {
  const [value, setValue] = useState('');
  const [mounted, setMounted] = useState(false);

  // Initialize search on mount to show all items (only once)
  useEffect(() => {
    if (!mounted) {
      setMounted(true);
      onSearch('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Debounced search effect - search as you type (only after mount)
  useEffect(() => {
    if (!mounted) return;
    
    const timer = setTimeout(() => {
      onSearch(value);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, onSearch, debounceMs, mounted]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(value);
  };

  const handleClear = () => {
    setValue('');
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative group">
        <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400 group-focus-within:text-primary-600 transition-colors" size={18} />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-10 py-2.5 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all placeholder:text-secondary-400"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 rounded-full transition-all"
          >
            <FiX size={16} />
          </button>
        )}
      </div>
    </form>
  );
};

export default SearchBar;

