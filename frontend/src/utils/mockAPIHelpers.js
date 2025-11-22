/**
 * Helper to ensure mock data is properly formatted for React Query
 * React Query expects: { data: { data: [...], pagination: {...} } }
 */

export const formatMockResponseForReactQuery = (mockResponse) => {
  // If mockResponse is already in the correct format, return it
  if (mockResponse && mockResponse.data && mockResponse.data.data !== undefined) {
    return mockResponse;
  }

  // Otherwise, wrap it properly
  return {
    data: {
      data: Array.isArray(mockResponse) ? mockResponse : (mockResponse ? [mockResponse] : []),
      pagination: {
        page: 1,
        limit: Array.isArray(mockResponse) ? mockResponse.length : 1,
        total: Array.isArray(mockResponse) ? mockResponse.length : 1,
        totalPages: 1,
      },
    },
  };
};

export default formatMockResponseForReactQuery;

