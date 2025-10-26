import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPackage, FiKey, FiUsers, FiX } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { assetsAPI, licensesAPI, usersAPI } from '../../config/api';

const GlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const navigate = useNavigate();
  const searchRef = useRef(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Search assets
  const { data: assetsData } = useQuery({
    queryKey: ['global-search-assets', debouncedTerm],
    queryFn: () => assetsAPI.getAll({ search: debouncedTerm, limit: 5 }).then(res => res.data),
    enabled: debouncedTerm.length > 2,
  });

  // Search licenses
  const { data: licensesData } = useQuery({
    queryKey: ['global-search-licenses', debouncedTerm],
    queryFn: () => licensesAPI.getAll({ search: debouncedTerm, limit: 5 }).then(res => res.data),
    enabled: debouncedTerm.length > 2,
  });

  // Search users
  const { data: usersData } = useQuery({
    queryKey: ['global-search-users', debouncedTerm],
    queryFn: () => usersAPI.getAll({ search: debouncedTerm, limit: 5 }).then(res => res.data),
    enabled: debouncedTerm.length > 2,
  });

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleResultClick = (type, id) => {
    navigate(`/${type}/${id}`);
    setIsOpen(false);
    setSearchTerm('');
  };

  const assets = assetsData?.data || [];
  const licenses = licensesData?.data || [];
  const users = usersData?.data || [];
  const hasResults = assets.length > 0 || licenses.length > 0 || users.length > 0;

  return (
    <div ref={searchRef} className="relative flex-1 max-w-2xl">
      {/* Search Input */}
      <div className="relative">
        <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search assets, licenses, people... (⌘K)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
        />
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm('');
              setIsOpen(false);
            }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <FiX size={18} />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && searchTerm.length > 2 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[500px] overflow-y-auto">
          {!hasResults && debouncedTerm === searchTerm && (
            <div className="p-8 text-center text-gray-500">
              <FiSearch size={48} className="mx-auto mb-4 opacity-30" />
              <p>No results found for "{searchTerm}"</p>
            </div>
          )}

          {/* Assets Section */}
          {assets.length > 0 && (
            <div className="border-b border-gray-100">
              <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Assets ({assets.length})
              </div>
              {assets.map((asset) => (
                <button
                  key={asset._id}
                  onClick={() => handleResultClick('assets', asset._id)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FiPackage className="text-blue-600" size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{asset.name}</p>
                    <p className="text-sm text-gray-500">
                      {asset.category} • {asset.manufacturer} {asset.model}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    {asset.status}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Licenses Section */}
          {licenses.length > 0 && (
            <div className="border-b border-gray-100">
              <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Licenses ({licenses.length})
              </div>
              {licenses.map((license) => (
                <button
                  key={license._id}
                  onClick={() => handleResultClick('licenses', license._id)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-purple-50 transition-colors text-left"
                >
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FiKey className="text-purple-600" size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{license.name}</p>
                    <p className="text-sm text-gray-500">
                      {license.vendor} • {license.assignedUsers?.length || 0}/{license.totalSeats} seats
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    ${license.cost}/mo
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Users Section */}
          {users.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                People ({users.length})
              </div>
              {users.map((user) => (
                <button
                  key={user._id}
                  onClick={() => handleResultClick('users', user._id)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-green-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{user.name}</p>
                    <p className="text-sm text-gray-500">
                      {user.jobTitle || user.role} • {user.department?.name || 'No department'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;

