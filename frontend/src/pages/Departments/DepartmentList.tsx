import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { departmentsAPI } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import SearchBar from '../../components/ui/SearchBar';
import { FiMapPin, FiUsers, FiDollarSign, FiGrid, FiPlus, FiTrendingUp, FiEye } from 'react-icons/fi';
import { getDepartmentConfig } from '../../utils/departmentIcons';

const DepartmentList = () => {
  const { canManage } = useAuth();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['departments', search],
    queryFn: () => {
      const params = {};
      if (search) params.search = search;
      return departmentsAPI.getAll(params).then((res) => res.data);
    },
  });

  if (isLoading) return <LoadingSpinner />;

  const departments = data?.data || [];
  const totalUsers = departments.reduce((sum, dept) => sum + (dept.users?.length || 0), 0);
  const totalBudget = departments.reduce((sum, dept) => sum + (dept.budget || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-secondary-900 tracking-tight">Departments</h1>
          <p className="text-secondary-600 mt-2 text-lg">
            Organizational structure and department management
          </p>
        </div>
        {canManage() && (
          <Link
            to="/departments/new"
            className="btn btn-primary flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow"
          >
            <FiPlus size={20} />
            Add Department
          </Link>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body text-center">
            <FiGrid className="mx-auto mb-2 text-primary-600" size={28} />
            <div className="text-3xl font-bold text-primary-600 mb-1">{departments.length}</div>
            <div className="text-sm text-gray-600">Departments</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <FiUsers className="mx-auto mb-2 text-emerald-600" size={28} />
            <div className="text-3xl font-bold text-emerald-600 mb-1">{totalUsers}</div>
            <div className="text-sm text-gray-600">Total Employees</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <FiDollarSign className="mx-auto mb-2 text-amber-600" size={28} />
            <div className="text-3xl font-bold text-amber-600 mb-1">
              ${(totalBudget / 1000000).toFixed(1)}M
            </div>
            <div className="text-sm text-gray-600">Total Budget</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <FiTrendingUp className="mx-auto mb-2 text-blue-600" size={28} />
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {departments.filter(d => d.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">Active Depts</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="card-body">
          <SearchBar
            onSearch={setSearch}
            placeholder="Search departments by name, code, or location..."
          />
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept, index) => {
          const deptConfig = getDepartmentConfig(dept.name);
          const DeptIcon = deptConfig.icon;
          
          return (
            <div 
              key={dept._id} 
              className="card hover:shadow-medium transition-all duration-300 group overflow-hidden animate-scale-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Header with gradient */}
              <div className={`h-2 bg-gradient-to-r ${deptConfig.color}`}></div>
              
              <div className="card-body">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${deptConfig.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                      <DeptIcon className="text-white" size={24} />
                    </div>
                  <div>
                    <Link to={`/departments/${dept._id}`}>
                      <h3 className="text-xl font-bold text-secondary-900 hover:text-primary-600 transition-colors">
                        {dept.name}
                      </h3>
                    </Link>
                    {dept.code && (
                      <p className="text-sm text-secondary-500 font-mono font-semibold">{dept.code}</p>
                    )}
                  </div>
                </div>
                <Badge variant={dept.status === 'active' ? 'success' : 'gray'}>
                  {dept.status}
                </Badge>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-secondary-600">
                    <FiMapPin size={14} className="text-primary-600" />
                    Location
                  </span>
                  <span className="font-semibold text-secondary-900">{dept.location || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-secondary-600">
                    <FiUsers size={14} className="text-emerald-600" />
                    Employees
                  </span>
                  <span className="font-semibold text-secondary-900">{dept.users?.length || 0}</span>
                </div>
                {dept.budget && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-secondary-600">
                      <FiDollarSign size={14} className="text-amber-600" />
                      Budget
                    </span>
                    <span className="font-semibold text-secondary-900">
                      ${dept.budget.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {dept.manager && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-secondary-500 uppercase tracking-wide mb-2">Department Manager</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      {dept.manager?.name?.charAt(0)?.toUpperCase() || 'M'}
                    </div>
                    <p className="text-sm font-semibold text-secondary-900">{dept.manager?.name || 'Manager'}</p>
                  </div>
                </div>
              )}

              {dept.description && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-secondary-600 italic">{dept.description}</p>
                </div>
              )}

              {/* View Details Button */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link
                  to={`/departments/${dept._id}`}
                  className="btn btn-primary btn-sm w-full flex items-center justify-center gap-2 group-hover:shadow-md transition-shadow"
                >
                  <FiEye size={16} />
                  View Details
                </Link>
              </div>
            </div>
          </div>
        );
        })}
      </div>
    </div>
  );
};

export default DepartmentList;

