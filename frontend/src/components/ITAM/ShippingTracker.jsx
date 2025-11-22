/**
 * Shipping Tracker
 * 
 * Track shipments and integrate with courier webhooks
 */

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { FiTruck, FiSearch, FiMapPin, FiClock, FiCheckCircle } from 'react-icons/fi';
import { itamAPI } from '../../config/api';
import LoadingSpinner from '../Common/LoadingSpinner';
import toast from 'react-hot-toast';

const ShippingTracker = ({ onClose }) => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');

  const { data: trackingData, isLoading, refetch } = useQuery({
    queryKey: ['tracking', trackingNumber, carrier],
    queryFn: () => itamAPI.locations.trackShipment({ trackingNumber, carrier }),
    enabled: false, // Only fetch when manually triggered
  });

  const handleTrack = () => {
    if (!trackingNumber || !carrier) {
      toast.error('Please enter tracking number and carrier');
      return;
    }
    refetch();
  };

  const shipment = trackingData?.data;

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-sm text-gray-700">
          <strong>Shipping Tracker</strong> integrates with courier services (Shippo, ShipEngine)
          to track shipments and update asset locations automatically.
        </div>
      </div>

      {/* Tracking Input */}
      <div className="space-y-4">
        <div>
          <label className="label">
            Carrier <span className="text-red-500">*</span>
          </label>
          <select
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            className="input"
            required
          >
            <option value="">Select carrier...</option>
            <option value="ups">UPS</option>
            <option value="fedex">FedEx</option>
            <option value="usps">USPS</option>
            <option value="dhl">DHL</option>
            <option value="shippo">Shippo</option>
            <option value="shipengine">ShipEngine</option>
          </select>
        </div>

        <div>
          <label className="label">
            Tracking Number <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="input flex-1"
              placeholder="Enter tracking number..."
              required
            />
            <button
              onClick={handleTrack}
              disabled={isLoading || !trackingNumber || !carrier}
              className="btn btn-primary shadow-md hover:shadow-lg transition-shadow"
            >
              <FiSearch />
              Track
            </button>
          </div>
        </div>
      </div>

      {/* Tracking Results */}
      {isLoading && <LoadingSpinner />}

      {shipment && !isLoading && (
        <div className="card border-2 border-slate-200">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Shipment Details</h3>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  shipment.status === 'delivered'
                    ? 'bg-green-100 text-green-800'
                    : shipment.status === 'in_transit'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {shipment.status}
              </span>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">From</div>
                  <div className="font-medium text-gray-900">{shipment.from}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">To</div>
                  <div className="font-medium text-gray-900">{shipment.to}</div>
                </div>
              </div>

              {shipment.trackingEvents && shipment.trackingEvents.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Tracking History</h4>
                  <div className="space-y-3">
                    {shipment.trackingEvents.map((event, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex-shrink-0 mt-1">
                          {event.status === 'delivered' ? (
                            <FiCheckCircle className="text-green-600" size={20} />
                          ) : (
                            <FiClock className="text-blue-600" size={20} />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{event.description}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <FiMapPin size={14} />
                                {event.location}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(event.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button onClick={onClose} className="btn btn-outline">
          Close
        </button>
      </div>
    </div>
  );
};

export default ShippingTracker;

