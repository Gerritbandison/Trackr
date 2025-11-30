import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assetsAPI, usersAPI, licensesAPI } from '../../config/api';
import axios from 'axios';

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    })),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedAxios = axios;

describe('API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Assets API', () => {
    it('should fetch all assets', async () => {
      const mockData = {
        data: {
          data: [{ id: '1', name: 'Asset 1' }],
          pagination: { page: 1, totalPages: 1 },
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockData);

      const result = await assetsAPI.getAll();

      expect(mockedAxios.get).toHaveBeenCalledWith('/assets', {
        params: undefined,
      });
      expect(result.data).toEqual(mockData.data);
    });

    it('should fetch asset by ID', async () => {
      const mockData = {
        data: { data: { id: '1', name: 'Asset 1' } },
      };

      mockedAxios.get.mockResolvedValueOnce(mockData);

      const result = await assetsAPI.getById('1');

      expect(mockedAxios.get).toHaveBeenCalledWith('/assets/1');
      expect(result.data).toEqual(mockData.data);
    });

    it('should create asset', async () => {
      const assetData = { name: 'New Asset', category: 'laptop' };
      const mockData = {
        data: { data: { id: '1', ...assetData } },
      };

      mockedAxios.post.mockResolvedValueOnce(mockData);

      const result = await assetsAPI.create(assetData);

      expect(mockedAxios.post).toHaveBeenCalledWith('/assets', assetData);
      expect(result.data).toEqual(mockData.data);
    });

    it('should update asset', async () => {
      const assetData = { name: 'Updated Asset' };
      const mockData = {
        data: { data: { id: '1', ...assetData } },
      };

      mockedAxios.put.mockResolvedValueOnce(mockData);

      const result = await assetsAPI.update('1', assetData);

      expect(mockedAxios.put).toHaveBeenCalledWith('/assets/1', assetData);
      expect(result.data).toEqual(mockData.data);
    });

    it('should delete asset', async () => {
      const mockData = { data: { message: 'Asset deleted' } };

      mockedAxios.delete.mockResolvedValueOnce(mockData);

      const result = await assetsAPI.delete('1');

      expect(mockedAxios.delete).toHaveBeenCalledWith('/assets/1');
      expect(result.data).toEqual(mockData.data);
    });
  });

  describe('Users API', () => {
    it('should fetch all users', async () => {
      const mockData = {
        data: {
          data: [{ id: '1', name: 'User 1', email: 'user1@example.com' }],
          pagination: { page: 1, totalPages: 1 },
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockData);

      const result = await usersAPI.getAll();

      expect(mockedAxios.get).toHaveBeenCalledWith('/users', {
        params: undefined,
      });
      expect(result.data).toEqual(mockData.data);
    });

    it('should fetch user by ID', async () => {
      const mockData = {
        data: { data: { id: '1', name: 'User 1', email: 'user1@example.com' } },
      };

      mockedAxios.get.mockResolvedValueOnce(mockData);

      const result = await usersAPI.getById('1');

      expect(mockedAxios.get).toHaveBeenCalledWith('/users/1');
      expect(result.data).toEqual(mockData.data);
    });

    it('should create user', async () => {
      const userData = { name: 'New User', email: 'new@example.com' };
      const mockData = {
        data: { data: { id: '1', ...userData } },
      };

      mockedAxios.post.mockResolvedValueOnce(mockData);

      const result = await usersAPI.create(userData);

      expect(mockedAxios.post).toHaveBeenCalledWith('/users', userData);
      expect(result.data).toEqual(mockData.data);
    });
  });

  describe('Licenses API', () => {
    it('should fetch all licenses', async () => {
      const mockData = {
        data: {
          data: [{ id: '1', name: 'License 1' }],
          pagination: { page: 1, totalPages: 1 },
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockData);

      const result = await licensesAPI.getAll();

      expect(mockedAxios.get).toHaveBeenCalledWith('/licenses', {
        params: undefined,
      });
      expect(result.data).toEqual(mockData.data);
    });

    it('should assign license to user', async () => {
      const mockData = {
        data: { data: { message: 'License assigned' } },
      };

      mockedAxios.post.mockResolvedValueOnce(mockData);

      const result = await licensesAPI.assign('1', { userId: 'user1' });

      expect(mockedAxios.post).toHaveBeenCalledWith('/licenses/1/assign', {
        userId: 'user1',
      });
      expect(result.data).toEqual(mockData.data);
    });
  });

  describe('API Error Handling', () => {
    it('should handle network errors', async () => {
      const networkError = {
        code: 'ERR_NETWORK',
        message: 'Network Error',
      };

      mockedAxios.get.mockRejectedValueOnce(networkError);

      await expect(assetsAPI.getAll()).rejects.toEqual(networkError);
    });

    it('should handle 404 errors', async () => {
      const notFoundError = {
        response: {
          status: 404,
          data: { message: 'Asset not found' },
        },
      };

      mockedAxios.get.mockRejectedValueOnce(notFoundError);

      await expect(assetsAPI.getById('999')).rejects.toBeDefined();
    });

    it('should handle 401 authentication errors', async () => {
      const authError = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
      };

      mockedAxios.get.mockRejectedValueOnce(authError);

      await expect(assetsAPI.getAll()).rejects.toBeDefined();
    });
  });
});

