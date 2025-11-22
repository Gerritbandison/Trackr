import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsAPI } from '../../../config/api';
import toast from 'react-hot-toast';
import { useMemo } from 'react';
import { getCategoryIcon } from '../../../utils/assetCategoryIcons';

export interface AssetFilters {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    category?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export const useAssets = (filters: AssetFilters = {}) => {
    const queryClient = useQueryClient();
    const { page = 1, limit = 50, search, status, category, sortBy, sortOrder } = filters;

    // Fetch assets
    const {
        data: assetsData,
        isLoading,
        isError,
        error,
        refetch
    } = useQuery({
        queryKey: ['assets', page, limit, search, status, category, sortBy, sortOrder],
        queryFn: async () => {
            try {
                const params = { page, limit, search, status, category, sortBy, sortOrder };
                const response = await assetsAPI.getAll(params);
                const responseData = response.data;

                // Standardize response format
                if (responseData?.data && Array.isArray(responseData.data)) {
                    return {
                        data: responseData.data,
                        pagination: responseData.pagination || {},
                    };
                }

                if (Array.isArray(responseData)) {
                    return {
                        data: responseData,
                        pagination: {},
                    };
                }

                return { data: [], pagination: {} };
            } catch (err) {
                throw err;
            }
        },
        refetchOnMount: true,
        refetchOnWindowFocus: false,
        retry: 1,
    });

    // Fetch all assets for stats
    const { data: allAssetsData } = useQuery({
        queryKey: ['all-assets-stats'],
        queryFn: () => assetsAPI.getAll({ limit: 500 }).then((res) => res.data.data || []),
    });

    // Calculate category stats
    const categoryStats = useMemo(() => {
        if (!allAssetsData || !Array.isArray(allAssetsData)) return [];

        const categories = ['laptop', 'desktop', 'monitor', 'phone', 'tablet', 'dock', 'keyboard', 'mouse', 'headset', 'webcam', 'accessory', 'other'];
        const stats = [];

        categories.forEach(cat => {
            const categoryAssets = allAssetsData.filter((a: any) => a.category === cat);
            if (categoryAssets.length > 0) {
                stats.push({
                    category: cat,
                    total: categoryAssets.length,
                    available: categoryAssets.filter((a: any) => a.status === 'available').length,
                    assigned: categoryAssets.filter((a: any) => a.status === 'assigned').length,
                    repair: categoryAssets.filter((a: any) => a.status === 'repair').length,
                    icon: getCategoryIcon(cat),
                });
            }
        });

        return stats.sort((a, b) => b.total - a.total);
    }, [allAssetsData]);

    // Mutations
    const deleteMutation = useMutation({
        mutationFn: (id: string) => assetsAPI.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assets'] });
            queryClient.invalidateQueries({ queryKey: ['all-assets-stats'] });
            toast.success('Asset deleted successfully');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to delete asset');
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => assetsAPI.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assets'] });
            queryClient.invalidateQueries({ queryKey: ['all-assets-stats'] });
            toast.success('Asset created successfully');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to create asset');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => assetsAPI.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assets'] });
            queryClient.invalidateQueries({ queryKey: ['all-assets-stats'] });
            toast.success('Asset updated successfully');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to update asset');
        },
    });

    const bulkStatusMutation = useMutation({
        mutationFn: async ({ assetIds, status }: { assetIds: string[]; status: string }) => {
            const promises = assetIds.map(id => assetsAPI.update(id, { status }));
            return Promise.all(promises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assets'] });
            queryClient.invalidateQueries({ queryKey: ['all-assets-stats'] });
            toast.success('Asset statuses updated successfully');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to update asset statuses');
        },
    });

    return {
        assets: assetsData?.data || [],
        pagination: assetsData?.pagination || {},
        isLoading,
        isError,
        error,
        refetch,
        categoryStats,
        deleteAsset: deleteMutation.mutate,
        deleteAssetAsync: deleteMutation.mutateAsync,
        createAsset: createMutation.mutate,
        createAssetAsync: createMutation.mutateAsync,
        updateAsset: updateMutation.mutate,
        updateAssetAsync: updateMutation.mutateAsync,
        bulkUpdateStatus: bulkStatusMutation.mutate,
        bulkUpdateStatusAsync: bulkStatusMutation.mutateAsync,
    };
};
