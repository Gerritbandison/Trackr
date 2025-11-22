/**
 * Smart Asset Form Component for Trackr
 * 
 * Features:
 * - Auto-detects asset type from serial number patterns
 * - Fetches warranty information from mock API
 * - Live compliance preview
 * - Full Zod validation with React Hook Form
 * - tRPC mutation integration
 * 
 * CURSOR: This component uses AI-optimized patterns for intelligent form handling
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { FiLoader, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { assetsAPI } from '../../config/api';

// Services
import { fetchWarrantyFromSerial, WarrantyData } from '../../services/warrantyService';
import { calculateCompliance } from '../../services/complianceService';
import { detectFromSerialNumber, AssetCategory } from '../../services/serialPatternService';

// Components
import CompliancePreviewCard from '../../features/assets/components/CompliancePreviewCard';
import AssetWarrantyCard from '../../features/assets/components/AssetWarrantyCard';
import AssetIdentificationSection from '../../features/assets/components/AssetIdentificationSection';
import PurchaseInformationSection from '../../features/assets/components/PurchaseInformationSection';
import StatusConditionSection from '../../features/assets/components/StatusConditionSection';
import CDWIntegrationSection from '../../features/assets/components/CDWIntegrationSection';

// Type definitions - synced with backend Asset model
type AssetStatus = 'available' | 'assigned' | 'repair' | 'retired' | 'lost' | 'disposed';
type AssetCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';

// Zod Schema for asset form validation - synced with backend validation schema
const assetFormSchema = z.object({
  name: z.string().min(2, 'Asset name must be at least 2 characters').max(100, 'Asset name too long'),
  category: z.enum(['laptop', 'desktop', 'monitor', 'keyboard', 'mouse', 'dock', 'phone', 'tablet', 'headset', 'webcam', 'accessory', 'other']),
  manufacturer: z.string().min(2, 'Manufacturer required').max(50),
  model: z.string().min(1, 'Model required').max(100),
  serialNumber: z.string().trim().optional().or(z.literal('')),
  assetTag: z.string().trim().optional().or(z.literal('')),
  purchaseDate: z.string().optional().or(z.literal('')),
  purchasePrice: z.coerce.number().min(0, 'Price must be positive').optional(),
  warrantyExpiry: z.string().optional().or(z.literal('')),
  warrantyProvider: z.string().trim().optional().or(z.literal('')),
  status: z.enum(['available', 'assigned', 'repair', 'retired', 'lost', 'disposed']),
  condition: z.enum(['excellent', 'good', 'fair', 'poor', 'damaged']),
  location: z.string().trim().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  vendor: z.string().trim().optional().or(z.literal('')),
  supplier: z.string().trim().optional().or(z.literal('')),
  cdwSku: z.string().trim().optional().or(z.literal('')),
  cdwUrl: z.string().url('Invalid URL').trim().optional().or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
});

type AssetFormData = z.infer<typeof assetFormSchema>;

// Asset creation hook - uses existing REST API (synced with backend)
// CURSOR: Uses assetsAPI.create which calls POST /api/v1/assets
const useCreateAsset = () => {
  return useMutation({
    mutationFn: async (data: AssetFormData) => {
      // Clean data - remove empty strings and convert dates
      const cleanData: Record<string, any> = { ...data };

      // Remove empty strings for optional fields
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === '' || cleanData[key] === null || cleanData[key] === undefined) {
          delete cleanData[key];
        }
      });

      // Convert date strings to ISO dates for backend
      if (cleanData.purchaseDate) {
        cleanData.purchaseDate = new Date(cleanData.purchaseDate).toISOString();
      }
      if (cleanData.warrantyExpiry) {
        cleanData.warrantyExpiry = new Date(cleanData.warrantyExpiry).toISOString();
      }

      // Convert purchasePrice to number if it exists
      if (cleanData.purchasePrice !== undefined && cleanData.purchasePrice !== '') {
        cleanData.purchasePrice = Number(cleanData.purchasePrice);
        if (isNaN(cleanData.purchasePrice)) {
          delete cleanData.purchasePrice;
        }
      }

      // Use existing assetsAPI
      return assetsAPI.create(cleanData);
    },
  });
};

interface AddAssetFormProps {
  onSuccess?: (asset: any) => void;
  onCancel?: () => void;
  initialData?: Partial<AssetFormData>;
}

const AddAssetForm: React.FC<AddAssetFormProps> = ({
  onSuccess,
  onCancel,
  initialData
}) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AssetFormData>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      category: 'laptop',
      status: 'available',
      condition: 'excellent',
      ...initialData,
    },
  });

  const watchedSerialNumber = watch('serialNumber');
  const watchedManufacturer = watch('manufacturer');
  const formData = watch();

  const [warrantyData, setWarrantyData] = useState<WarrantyData | null>(null);
  const [isFetchingWarranty, setIsFetchingWarranty] = useState(false);
  const [autoDetected, setAutoDetected] = useState(false);

  const createAssetMutation = useCreateAsset();

  // Live compliance preview
  const compliancePreview = useMemo(() => {
    return calculateCompliance(formData);
  }, [formData]);

  // Auto-detect asset type from serial number
  // CURSOR: Auto-fill asset category and manufacturer from serial number patterns
  useEffect(() => {
    if (watchedSerialNumber && watchedSerialNumber.length >= 3) {
      const detection = detectFromSerialNumber(watchedSerialNumber);

      if (detection && !autoDetected) {
        setValue('category', detection.category);
        setValue('manufacturer', detection.manufacturer);
        if (detection.model && !watchedManufacturer) {
          setValue('model', detection.model);
        }
        setAutoDetected(true);
        toast.success(`Auto-detected: ${detection.manufacturer} ${detection.category}`);
      }
    }
  }, [watchedSerialNumber, setValue, autoDetected, watchedManufacturer]);

  // Auto-fetch warranty when serial number changes
  // CURSOR: Auto-fill warranty expiry from serial number lookup
  useEffect(() => {
    const fetchWarranty = async () => {
      if (watchedSerialNumber && watchedSerialNumber.length >= 3 && watchedManufacturer) {
        setIsFetchingWarranty(true);
        try {
          const warranty = await fetchWarrantyFromSerial(watchedSerialNumber, watchedManufacturer);
          if (warranty) {
            setWarrantyData(warranty);
            setValue('warrantyExpiry', warranty.expiryDate);
            setValue('warrantyProvider', warranty.provider);
            toast.success('Warranty information fetched');
          }
        } catch (error) {
          console.error('Warranty lookup failed:', error);
        } finally {
          setIsFetchingWarranty(false);
        }
      }
    };

    const timeoutId = setTimeout(fetchWarranty, 1000); // Debounce
    return () => clearTimeout(timeoutId);
  }, [watchedSerialNumber, watchedManufacturer, setValue]);

  const onSubmit = async (data: AssetFormData) => {
    try {
      const result = await createAssetMutation.mutateAsync(data);
      // Backend returns { success: true, data: asset }
      toast.success('Asset created successfully!');
      onSuccess?.(result.data?.data || result.data || result);
    } catch (error: any) {
      // Handle validation errors from backend
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        if (Array.isArray(errors)) {
          errors.forEach((err: any) => {
            const message = typeof err === 'string' ? err : err.message || err.msg || JSON.stringify(err);
            toast.error(message);
          });
        } else if (typeof errors === 'object') {
          Object.keys(errors).forEach(key => {
            const value = errors[key];
            const message = typeof value === 'string' ? value : value.msg || value.message || JSON.stringify(value);
            toast.error(`${key}: ${message}`);
          });
        }
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to create asset';
        toast.error(errorMessage);
      }
      console.error('Asset creation error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Compliance Preview Card */}
      <CompliancePreviewCard compliancePreview={compliancePreview} />

      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Asset Identification */}
        <AssetIdentificationSection
          register={register}
          errors={errors}
          autoDetected={autoDetected}
          isFetchingWarranty={isFetchingWarranty}
        />

        {/* Warranty Information */}
        {warrantyData && <AssetWarrantyCard warrantyData={warrantyData} />}

        {/* Purchase Information */}
        <PurchaseInformationSection
          register={register}
          errors={errors}
          warrantyData={warrantyData}
        />

        {/* Status & Condition */}
        <StatusConditionSection
          register={register}
          errors={errors}
        />

        {/* CDW Integration */}
        <CDWIntegrationSection
          register={register}
          errors={errors}
        />

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-outline"
              disabled={isSubmitting || createAssetMutation.isPending}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || createAssetMutation.isPending}
          >
            {isSubmitting || createAssetMutation.isPending ? (
              <>
                <FiLoader className="animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                <FiCheckCircle className="mr-2" />
                Create Asset
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddAssetForm;
