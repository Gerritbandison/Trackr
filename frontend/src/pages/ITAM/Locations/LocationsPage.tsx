/**
 * Locations & Shipping Page
 * 
 * Features:
 * - Hierarchical locations (Region→Office→Room→Rack/Bin)
 * - Courier webhooks (Shippo/ShipEngine)
 * - Chain of custody tracking
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiMapPin,
  FiPlus,
  FiPackage,
  FiTruck,
  FiEdit,
  FiTrash2,
  FiLayers,
  FiHome,
  FiBox,
  FiNavigation,
} from 'react-icons/fi';
import { itamAPI } from '../../../config/api';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import Modal from '../../../components/ui/Modal';
import SearchBar from '../../../components/ui/SearchBar';
import Pagination from '../../../components/ui/Pagination';
import toast from 'react-hot-toast';
import LocationForm from '../../../components/ITAM/LocationForm';
import ShippingTracker from '../../../components/ITAM/ShippingTracker';

const LocationsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('all'); // 'all', 'region', 'office', 'room', 'rack'
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const queryClient = useQueryClient();
  const limit = 20;

  // Fetch locations
  const { data: locationsData, isLoading } = useQuery({
    queryKey: ['locations', currentPage, searchTerm, filter],
    queryFn: () =>
      itamAPI.locations.getAll({
        page: currentPage,
        limit,
        search: searchTerm,
        filter,
      }),
  });

  // Fetch locations tree
  const { data: treeData } = useQuery({
    queryKey: ['locations-tree'],
    queryFn: () => itamAPI.locations.getTree(),
  });

  // Fetch active shipments
  const { data: shipmentsData } = useQuery({
    queryKey: ['active-shipments'],
    queryFn: () => itamAPI.locations.getActiveShipments(),
  });

  // Delete location mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => itamAPI.locations.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['locations']);
      queryClient.invalidateQueries(['locations-tree']);
      toast.success('Location deleted');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete location');
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const locations = locationsData?.data?.data || [];
  const pagination = locationsData?.data?.pagination || {};
  const tree = treeData?.data || [];
  const shipments = shipmentsData?.data || [];

  const getLocationIcon = (type) => {
    switch (type) {
      case 'region':
        return <FiMapPin className="text-blue-600" size={20} />;
      case 'office':
        return <FiHome className="text-green-600" size={20} />;
      case 'room':
        return <FiHome className="text-purple-600" size={20} />;
      case 'rack':
      case 'bin':
        return <FiBox className="text-orange-600" size={20} />;
      default:
        return <FiMapPin className="text-gray-600" size={20} />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            Locations & Shipping
          </h1>
          <p className="text-gray-600 mt-2">
            Manage hierarchical locations and track shipments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowShippingModal(true)}
            className="btn btn-outline flex items-center gap-2 hover:shadow-md transition-shadow"
          >
            <FiTruck />
            Track Shipment
          </button>
          <button
            onClick={() => {
              setSelectedLocation(null);
              setShowLocationModal(true);
            }}
            className="btn btn-primary flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
          >
            <FiPlus />
            Add Location
          </button>
        </div>
      </div>

      {/* Active Shipments */}
      {shipments.length > 0 && (
        <div className="card border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
          <div className="card-body">
            <div className="flex items-center gap-2 mb-4">
              <FiTruck className="text-blue-600" size={24} />
              <h3 className="text-lg font-semibold text-gray-900">Active Shipments</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {shipments.slice(0, 6).map((shipment) => (
                <div
                  key={shipment.id}
                  className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="font-medium text-gray-900 mb-1">
                    {shipment.trackingNumber}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {shipment.from} → {shipment.to}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {shipment.status}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setShowShippingModal(true);
                    }}
                    className="btn btn-sm btn-primary w-full shadow-md hover:shadow-lg transition-shadow"
                  >
                    Track
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Location Tree */}
      <div className="card border-2 border-slate-200 hover:shadow-lg transition-shadow">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Location Hierarchy</h2>
          </div>
          <div className="space-y-2">
            {tree.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FiMapPin className="mx-auto mb-3 text-gray-300" size={48} />
                <div className="text-lg font-medium">No locations found</div>
                <div className="text-sm mt-1">Create a location to get started</div>
              </div>
            ) : (
              <LocationTree
                locations={tree}
                onEdit={(location) => {
                  setSelectedLocation(location);
                  setShowLocationModal(true);
                }}
                onDelete={(id) => {
                  if (window.confirm('Are you sure you want to delete this location?')) {
                    deleteMutation.mutate(id);
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card border-2 border-slate-200 hover:border-primary-300 transition-colors">
        <div className="card-body">
          <div className="flex items-center gap-4">
            <SearchBar
              onSearch={setSearchTerm}
              placeholder="Search locations..."
            />
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`btn btn-sm transition-all ${filter === 'all' ? 'btn-primary shadow-md' : 'btn-outline'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('region')}
                className={`btn btn-sm transition-all ${filter === 'region' ? 'btn-primary shadow-md' : 'btn-outline'}`}
              >
                Regions
              </button>
              <button
                onClick={() => setFilter('office')}
                className={`btn btn-sm transition-all ${filter === 'office' ? 'btn-primary shadow-md' : 'btn-outline'}`}
              >
                Offices
              </button>
              <button
                onClick={() => setFilter('room')}
                className={`btn btn-sm transition-all ${filter === 'room' ? 'btn-primary shadow-md' : 'btn-outline'}`}
              >
                Rooms
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Locations Table */}
      <div className="card border-2 border-slate-200 hover:shadow-lg transition-shadow">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Locations</h2>
            <div className="text-sm text-gray-600">
              {locations.length} location{locations.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Parent</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Address</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Assets</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {locations.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-gray-500">
                      <FiMapPin className="mx-auto mb-3 text-gray-300" size={48} />
                      <div className="text-lg font-medium">No locations found</div>
                      <div className="text-sm mt-1">Create a location to get started</div>
                    </td>
                  </tr>
                ) : (
                  locations.map((location) => (
                    <tr key={location.id} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-primary-50/30 hover:to-transparent transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getLocationIcon(location.type)}
                          <div>
                            <div className="font-medium">{location.name}</div>
                            <div className="text-sm text-gray-500">{location.code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                          {location.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {location.parent ? (
                          <div className="text-sm text-gray-600">{location.parent.name}</div>
                        ) : (
                          <span className="text-sm text-gray-400">Root</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-600">
                          {location.address || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {location.assetCount || 0}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedLocation(location);
                              setShowLocationModal(true);
                            }}
                            className="btn btn-sm btn-outline hover:shadow-md transition-shadow"
                          >
                            <FiEdit />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this location?')) {
                                deleteMutation.mutate(location.id);
                              }
                            }}
                            className="btn btn-sm btn-outline text-red-600 hover:bg-red-50 hover:shadow-md transition-shadow"
                          >
                            <FiTrash2 />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Location Modal */}
      <Modal
        isOpen={showLocationModal}
        onClose={() => {
          setShowLocationModal(false);
          setSelectedLocation(null);
        }}
        title={selectedLocation ? 'Edit Location' : 'Add Location'}
        size="lg"
      >
        <LocationForm
          location={selectedLocation}
          onSuccess={() => {
            setShowLocationModal(false);
            setSelectedLocation(null);
            queryClient.invalidateQueries(['locations']);
            queryClient.invalidateQueries(['locations-tree']);
          }}
          onCancel={() => {
            setShowLocationModal(false);
            setSelectedLocation(null);
          }}
        />
      </Modal>

      {/* Shipping Tracker Modal */}
      <Modal
        isOpen={showShippingModal}
        onClose={() => setShowShippingModal(false)}
        title="Track Shipment"
        size="lg"
      >
        <ShippingTracker onClose={() => setShowShippingModal(false)} />
      </Modal>
    </div>
  );
};

// Location Tree Component
const LocationTree = ({ locations, onEdit, onDelete, level = 0 }) => {
  return (
    <div className={`space-y-2 ${level > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
      {locations.map((location) => (
        <div key={location.id}>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              {location.type === 'region' && <FiMapPin className="text-blue-600" size={18} />}
              {location.type === 'office' && <FiHome className="text-green-600" size={18} />}
              {location.type === 'room' && <FiHome className="text-purple-600" size={18} />}
              {(location.type === 'rack' || location.type === 'bin') && (
                <FiBox className="text-orange-600" size={18} />
              )}
              <div>
                <div className="font-medium text-gray-900">{location.name}</div>
                <div className="text-sm text-gray-500">{location.code}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {location.assetCount || 0} assets
              </span>
              <button
                onClick={() => onEdit(location)}
                className="btn btn-sm btn-outline hover:shadow-md transition-shadow"
              >
                <FiEdit />
              </button>
              <button
                onClick={() => onDelete(location.id)}
                className="btn btn-sm btn-outline text-red-600 hover:bg-red-50 hover:shadow-md transition-shadow"
              >
                <FiTrash2 />
              </button>
            </div>
          </div>
          {location.children && location.children.length > 0 && (
            <LocationTree
              locations={location.children}
              onEdit={onEdit}
              onDelete={onDelete}
              level={level + 1}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default LocationsPage;

