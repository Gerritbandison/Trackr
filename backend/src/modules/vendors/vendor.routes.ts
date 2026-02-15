import { Router, Response } from 'express';
import Vendor from './vendor.model';
import { authenticate, authorize, AuthRequest } from '../../core/middleware/auth.middleware';
import { validate, validateQuery, validateParams } from '../../core/middleware/validate.middleware';
import { ApiResponse } from '../../core/utils/response';
import { parsePaginationParams } from '../../core/utils/pagination';
import {
    createVendorSchema,
    updateVendorSchema,
    vendorQuerySchema,
    vendorIdParamSchema,
    addContractSchema,
    addContactSchema,
    bulkUpdateVendorStatusSchema,
    bulkDeleteVendorsSchema,
    expiringContractsQuerySchema
} from '../../core/schemas/vendor.schemas';
import mongoose from 'mongoose';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// ============================================
// List & Search
// ============================================

// Get all vendors with filtering
router.get('/',
    validateQuery(vendorQuerySchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const { status, category, search, hasActiveContract, includeDeleted } = req.query;
            const filter: Record<string, any> = {};
            
            if (status) filter.status = status;
            if (category) filter.category = category;
            if (includeDeleted === 'true') filter.includeDeleted = true;
            
            // Text search
            if (search) {
                filter.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { notes: { $regex: search, $options: 'i' } },
                    { tags: { $in: [new RegExp(search as string, 'i')] } }
                ];
            }

            // Filter by active contracts
            if (hasActiveContract === 'true') {
                filter['contracts.status'] = 'active';
            }

            const { page, limit, sort } = parsePaginationParams(req.query);
            const skip = (page! - 1) * limit!;

            const [data, total] = await Promise.all([
                Vendor.find(filter)
                    .select('-__v')
                    .sort(sort)
                    .skip(skip)
                    .limit(limit!)
                    .lean(),
                Vendor.countDocuments(filter)
            ]);

            return ApiResponse.paginated(res, data, total, page!, limit!);
        } catch (error) {
            return ApiResponse.error(res, 'Error fetching vendors', error instanceof Error ? error.message : 'Unknown error');
        }
    }
);

// Get vendors with expiring contracts
router.get('/expiring-contracts',
    validateQuery(expiringContractsQuerySchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const days = parseInt(req.query.days as string) || 30;
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() + days);

            const vendors = await Vendor.find({
                'contracts.status': 'active',
                'contracts.endDate': { $lte: cutoffDate }
            })
                .select('name contacts contracts')
                .lean();

            // Extract expiring contracts with vendor info
            const expiringContracts = vendors.flatMap(vendor => 
                vendor.contracts
                    .filter((c: any) => c.status === 'active' && new Date(c.endDate) <= cutoffDate)
                    .map((c: any) => ({
                        vendor: { _id: vendor._id, name: vendor.name },
                        contract: c,
                        daysUntilExpiry: Math.ceil((new Date(c.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    }))
            ).sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

            return ApiResponse.success(res, expiringContracts);
        } catch (error) {
            return ApiResponse.error(res, 'Error fetching expiring contracts', error instanceof Error ? error.message : 'Unknown error');
        }
    }
);

// ============================================
// Single Vendor Operations
// ============================================

// Get vendor by ID
router.get('/:id',
    validateParams(vendorIdParamSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const vendor = await Vendor.findById(req.params.id)
                .select('-__v')
                .lean();
                
            if (!vendor) {
                return ApiResponse.notFound(res, 'Vendor not found');
            }

            return ApiResponse.success(res, vendor);
        } catch (error) {
            return ApiResponse.error(res, 'Error fetching vendor', error instanceof Error ? error.message : 'Unknown error');
        }
    }
);

// Create vendor (admin/manager)
router.post('/',
    authorize('admin', 'manager'),
    validate(createVendorSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const vendor = new Vendor(req.body);
            await vendor.save();

            return ApiResponse.created(res, vendor, 'Vendor created successfully');
        } catch (error) {
            if ((error as any).code === 11000) {
                return ApiResponse.badRequest(res, 'Vendor with this name already exists');
            }
            return ApiResponse.error(res, 'Error creating vendor', error instanceof Error ? error.message : 'Unknown error', 400);
        }
    }
);

// Update vendor (admin/manager)
router.put('/:id',
    authorize('admin', 'manager'),
    validateParams(vendorIdParamSchema),
    validate(updateVendorSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const vendor = await Vendor.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );
            
            if (!vendor) {
                return ApiResponse.notFound(res, 'Vendor not found');
            }

            return ApiResponse.success(res, vendor, 'Vendor updated successfully');
        } catch (error) {
            if ((error as any).code === 11000) {
                return ApiResponse.badRequest(res, 'Vendor with this name already exists');
            }
            return ApiResponse.error(res, 'Error updating vendor', error instanceof Error ? error.message : 'Unknown error', 400);
        }
    }
);

// Soft delete vendor (admin only)
router.delete('/:id',
    authorize('admin'),
    validateParams(vendorIdParamSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const vendor = await Vendor.findById(req.params.id);
            if (!vendor) {
                return ApiResponse.notFound(res, 'Vendor not found');
            }

            // Soft delete
            vendor.isDeleted = true;
            vendor.deletedAt = new Date();
            vendor.deletedBy = req.user?._id;
            await vendor.save();

            return ApiResponse.deleted(res, 'Vendor deleted successfully');
        } catch (error) {
            return ApiResponse.error(res, 'Error deleting vendor', error instanceof Error ? error.message : 'Unknown error');
        }
    }
);

// Restore soft-deleted vendor (admin only)
router.post('/:id/restore',
    authorize('admin'),
    validateParams(vendorIdParamSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const vendor = await Vendor.findOne({ _id: req.params.id, isDeleted: true, includeDeleted: true });
            if (!vendor) {
                return ApiResponse.notFound(res, 'Deleted vendor not found');
            }

            vendor.isDeleted = false;
            vendor.deletedAt = undefined;
            vendor.deletedBy = undefined;
            await vendor.save();

            return ApiResponse.success(res, vendor, 'Vendor restored successfully');
        } catch (error) {
            return ApiResponse.error(res, 'Error restoring vendor', error instanceof Error ? error.message : 'Unknown error');
        }
    }
);

// Permanently delete vendor (admin only)
router.delete('/:id/permanent',
    authorize('admin'),
    validateParams(vendorIdParamSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const vendor = await Vendor.findOneAndDelete({ _id: req.params.id, includeDeleted: true });
            if (!vendor) {
                return ApiResponse.notFound(res, 'Vendor not found');
            }

            return ApiResponse.deleted(res, 'Vendor permanently deleted');
        } catch (error) {
            return ApiResponse.error(res, 'Error permanently deleting vendor', error instanceof Error ? error.message : 'Unknown error');
        }
    }
);

// ============================================
// Contract Management
// ============================================

// Add contract to vendor
router.post('/:id/contracts',
    authorize('admin', 'manager'),
    validateParams(vendorIdParamSchema),
    validate(addContractSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const vendor = await Vendor.findById(req.params.id);
            if (!vendor) {
                return ApiResponse.notFound(res, 'Vendor not found');
            }

            vendor.contracts.push(req.body);
            await vendor.save();

            return ApiResponse.created(res, vendor, 'Contract added successfully');
        } catch (error) {
            return ApiResponse.error(res, 'Error adding contract', error instanceof Error ? error.message : 'Unknown error', 400);
        }
    }
);

// Update contract
router.put('/:id/contracts/:contractId',
    authorize('admin', 'manager'),
    validateParams(vendorIdParamSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const vendor = await Vendor.findById(req.params.id);
            if (!vendor) {
                return ApiResponse.notFound(res, 'Vendor not found');
            }

            const contractIndex = vendor.contracts.findIndex(
                (c: any) => c._id?.toString() === req.params.contractId
            );
            
            if (contractIndex === -1) {
                return ApiResponse.notFound(res, 'Contract not found');
            }

            Object.assign(vendor.contracts[contractIndex], req.body);
            await vendor.save();

            return ApiResponse.success(res, vendor, 'Contract updated successfully');
        } catch (error) {
            return ApiResponse.error(res, 'Error updating contract', error instanceof Error ? error.message : 'Unknown error', 400);
        }
    }
);

// Delete contract
router.delete('/:id/contracts/:contractId',
    authorize('admin'),
    validateParams(vendorIdParamSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const vendor = await Vendor.findById(req.params.id);
            if (!vendor) {
                return ApiResponse.notFound(res, 'Vendor not found');
            }

            const contractIndex = vendor.contracts.findIndex(
                (c: any) => c._id?.toString() === req.params.contractId
            );
            
            if (contractIndex === -1) {
                return ApiResponse.notFound(res, 'Contract not found');
            }

            vendor.contracts.splice(contractIndex, 1);
            await vendor.save();

            return ApiResponse.success(res, vendor, 'Contract deleted successfully');
        } catch (error) {
            return ApiResponse.error(res, 'Error deleting contract', error instanceof Error ? error.message : 'Unknown error');
        }
    }
);

// ============================================
// Contact Management
// ============================================

// Add contact to vendor
router.post('/:id/contacts',
    authorize('admin', 'manager'),
    validateParams(vendorIdParamSchema),
    validate(addContactSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const vendor = await Vendor.findById(req.params.id);
            if (!vendor) {
                return ApiResponse.notFound(res, 'Vendor not found');
            }

            // If new contact is primary, unset other primary contacts
            if (req.body.isPrimary) {
                vendor.contacts.forEach((c: any) => { c.isPrimary = false; });
            }

            vendor.contacts.push(req.body);
            await vendor.save();

            return ApiResponse.created(res, vendor, 'Contact added successfully');
        } catch (error) {
            return ApiResponse.error(res, 'Error adding contact', error instanceof Error ? error.message : 'Unknown error', 400);
        }
    }
);

// Update contact
router.put('/:id/contacts/:contactId',
    authorize('admin', 'manager'),
    validateParams(vendorIdParamSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const vendor = await Vendor.findById(req.params.id);
            if (!vendor) {
                return ApiResponse.notFound(res, 'Vendor not found');
            }

            const contactIndex = vendor.contacts.findIndex(
                (c: any) => c._id?.toString() === req.params.contactId
            );
            
            if (contactIndex === -1) {
                return ApiResponse.notFound(res, 'Contact not found');
            }

            // If updating to primary, unset other primary contacts
            if (req.body.isPrimary) {
                vendor.contacts.forEach((c: any) => { c.isPrimary = false; });
            }

            Object.assign(vendor.contacts[contactIndex], req.body);
            await vendor.save();

            return ApiResponse.success(res, vendor, 'Contact updated successfully');
        } catch (error) {
            return ApiResponse.error(res, 'Error updating contact', error instanceof Error ? error.message : 'Unknown error', 400);
        }
    }
);

// Delete contact
router.delete('/:id/contacts/:contactId',
    authorize('admin'),
    validateParams(vendorIdParamSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const vendor = await Vendor.findById(req.params.id);
            if (!vendor) {
                return ApiResponse.notFound(res, 'Vendor not found');
            }

            const contactIndex = vendor.contacts.findIndex(
                (c: any) => c._id?.toString() === req.params.contactId
            );
            
            if (contactIndex === -1) {
                return ApiResponse.notFound(res, 'Contact not found');
            }

            vendor.contacts.splice(contactIndex, 1);
            await vendor.save();

            return ApiResponse.success(res, vendor, 'Contact deleted successfully');
        } catch (error) {
            return ApiResponse.error(res, 'Error deleting contact', error instanceof Error ? error.message : 'Unknown error');
        }
    }
);

// ============================================
// Bulk Operations
// ============================================

// Bulk update vendor status
router.patch('/bulk/status',
    authorize('admin'),
    validate(bulkUpdateVendorStatusSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const { ids, status } = req.body;

            const result = await Vendor.updateMany(
                { _id: { $in: ids } },
                { $set: { status } }
            );

            return ApiResponse.success(res, {
                modified: result.modifiedCount,
                matched: result.matchedCount
            }, 'Vendor statuses updated successfully');
        } catch (error) {
            return ApiResponse.error(res, 'Error updating vendor statuses', error instanceof Error ? error.message : 'Unknown error');
        }
    }
);

// Bulk soft delete vendors
router.post('/bulk/delete',
    authorize('admin'),
    validate(bulkDeleteVendorsSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const { ids, permanent } = req.body;

            if (permanent) {
                const result = await Vendor.deleteMany({ _id: { $in: ids }, includeDeleted: true } as any);
                return ApiResponse.success(res, { deleted: result.deletedCount }, 'Vendors permanently deleted');
            }

            const result = await Vendor.updateMany(
                { _id: { $in: ids } },
                { 
                    $set: { 
                        isDeleted: true, 
                        deletedAt: new Date(),
                        deletedBy: req.user?._id
                    }
                }
            );

            return ApiResponse.success(res, {
                deleted: result.modifiedCount
            }, 'Vendors deleted successfully');
        } catch (error) {
            return ApiResponse.error(res, 'Error deleting vendors', error instanceof Error ? error.message : 'Unknown error');
        }
    }
);

export default router;
