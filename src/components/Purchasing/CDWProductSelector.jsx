import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FiSearch, FiShoppingCart, FiExternalLink, FiLoader } from 'react-icons/fi';
import { cdwAPI } from '../../config/api';
import LoadingSpinner from '../Common/LoadingSpinner';
import Modal from '../Common/Modal';
import toast from 'react-hot-toast';

const CDWProductSelector = ({ isOpen, onClose, onSelectProduct }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { value: 'all', label: 'All Products' },
    { value: 'laptop', label: 'Laptops' },
    { value: 'desktop', label: 'Desktops' },
    { value: 'monitor', label: 'Monitors' },
    { value: 'dock', label: 'Docking Stations' },
    { value: 'keyboard', label: 'Keyboards' },
    { value: 'mouse', label: 'Mice' },
    { value: 'headset', label: 'Headsets' },
    { value: 'webcam', label: 'Webcams' },
  ];

  // Mock product data for demonstration
  const mockProducts = [
    { sku: 'CDW12345', name: 'Lenovo ThinkPad X1 Carbon Gen 11', manufacturer: 'Lenovo', model: 'X1 Carbon', category: 'laptop', price: { sale: 1399.99, list: 1599.99 }, url: 'https://www.cdw.com/product/laptop' },
    { sku: 'CDW12346', name: 'Dell Latitude 5540', manufacturer: 'Dell', model: 'Latitude 5540', category: 'laptop', price: { sale: 1199.99, list: 1399.99 }, url: 'https://www.cdw.com/product/laptop' },
    { sku: 'CDW12347', name: 'HP EliteBook 840 G10', manufacturer: 'HP', model: 'EliteBook 840', category: 'laptop', price: { sale: 1249.99, list: 1449.99 }, url: 'https://www.cdw.com/product/laptop' },
    { sku: 'CDW12348', name: 'Microsoft Surface Laptop 5', manufacturer: 'Microsoft', model: 'Surface Laptop 5', category: 'laptop', price: { sale: 1299.99, list: 1499.99 }, url: 'https://www.cdw.com/product/laptop' },
    { sku: 'CDW12349', name: 'Dell UltraSharp U2723DE 27" Monitor', manufacturer: 'Dell', model: 'U2723DE', category: 'monitor', price: { sale: 449.99, list: 549.99 }, url: 'https://www.cdw.com/product/monitor' },
    { sku: 'CDW12350', name: 'HP EliteDisplay E243 24" Monitor', manufacturer: 'HP', model: 'E243', category: 'monitor', price: { sale: 229.99, list: 279.99 }, url: 'https://www.cdw.com/product/monitor' },
    { sku: 'CDW12351', name: 'Lenovo ThinkPad Universal Thunderbolt 4 Dock', manufacturer: 'Lenovo', model: 'TB4 Dock', category: 'dock', price: { sale: 229.99, list: 279.99 }, url: 'https://www.cdw.com/product/dock' },
    { sku: 'CDW12352', name: 'Dell WD19TBS Thunderbolt Dock', manufacturer: 'Dell', model: 'WD19TBS', category: 'dock', price: { sale: 249.99, list: 299.99 }, url: 'https://www.cdw.com/product/dock' },
    { sku: 'CDW12353', name: 'Logitech MX Master 3S Mouse', manufacturer: 'Logitech', model: 'MX Master 3S', category: 'mouse', price: { sale: 99.99, list: 129.99 }, url: 'https://www.cdw.com/product/mouse' },
    { sku: 'CDW12354', name: 'Microsoft Surface Keyboard', manufacturer: 'Microsoft', model: 'Surface Keyboard', category: 'keyboard', price: { sale: 89.99, list: 109.99 }, url: 'https://www.cdw.com/product/keyboard' },
    { sku: 'CDW12355', name: 'Jabra Evolve2 65 Headset', manufacturer: 'Jabra', model: 'Evolve2 65', category: 'headset', price: { sale: 199.99, list: 249.99 }, url: 'https://www.cdw.com/product/headset' },
    { sku: 'CDW12356', name: 'Logitech Brio 4K Webcam', manufacturer: 'Logitech', model: 'Brio 4K', category: 'webcam', price: { sale: 179.99, list: 219.99 }, url: 'https://www.cdw.com/product/webcam' },
  ];

  const { data: products, isLoading, error } = useQuery({
    queryKey: ['cdw-products', searchTerm, selectedCategory],
    queryFn: async () => {
      try {
        const res = await cdwAPI.searchProducts({ 
          q: searchTerm, 
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          limit: 50 
        });
        return res.data.data;
      } catch (err) {
        // Return mock data if API fails
        console.log('CDW API not available, using mock data');
        return filterMockProducts(mockProducts, searchTerm, selectedCategory);
      }
    },
    enabled: isOpen && (searchTerm.length > 0 || selectedCategory !== 'all'),
  });

  const filterMockProducts = (products, search, category) => {
    let filtered = products;
    
    // Filter by category
    if (category !== 'all') {
      filtered = filtered.filter(p => p.category === category);
    }
    
    // Filter by search term (skip if search is just whitespace)
    if (search && search.trim().length > 0) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.manufacturer.toLowerCase().includes(searchLower) ||
        p.model.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(searchQuery);
  };

  // Trigger search when category changes
  useEffect(() => {
    if (selectedCategory !== 'all' && searchTerm === '') {
      setSearchTerm(' '); // Set a space to trigger the query
    }
  }, [selectedCategory, searchTerm]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchTerm('');
      setSelectedCategory('all');
    }
  }, [isOpen]);

  const handleSelectProduct = (product) => {
    // Map CDW product to asset fields
    const assetData = {
      name: product.name,
      manufacturer: product.manufacturer || '',
      model: product.model || '',
      category: mapCategory(product.category),
      purchasePrice: product.price?.sale || product.price?.list || 0,
      notes: `Purchased from CDW. SKU: ${product.sku}`,
      vendor: 'CDW',
      cdwSku: product.sku,
      cdwUrl: product.url,
    };
    
    onSelectProduct(assetData);
    onClose();
    toast.success('Product selected from CDW');
  };

  const mapCategory = (cdwCategory) => {
    const categoryMap = {
      'laptop': 'laptop',
      'notebook': 'laptop',
      'desktop': 'desktop',
      'workstation': 'desktop',
      'monitor': 'monitor',
      'display': 'monitor',
      'dock': 'dock',
      'docking': 'dock',
      'keyboard': 'keyboard',
      'mouse': 'mouse',
      'headset': 'headset',
      'webcam': 'webcam',
    };
    return categoryMap[cdwCategory?.toLowerCase()] || 'other';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Purchase from CDW" size="xl">
      <div className="space-y-4">
        {/* Info Banner */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <FiShoppingCart className="text-blue-600 text-xl" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">CDW Product Catalog</h3>
              <p className="text-sm text-blue-800 mt-1">
                Search and select products from CDW to automatically populate asset information.
                Product details, pricing, and specifications will be imported.
              </p>
              {error && (
                <p className="text-xs text-amber-700 mt-2 bg-amber-50 px-2 py-1 rounded">
                  ⚠️ Using demo data - CDW API backend not configured yet
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search CDW products (e.g., ThinkPad, Surface, Dell)"
                className="input pl-10"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </div>

          {/* Category Filter */}
          <div>
            <label className="label">Filter by Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
        </form>

        {/* Results */}
        {isLoading && <LoadingSpinner />}

        {products && !isLoading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                Found {products.length} {products.length === 1 ? 'product' : 'products'}
              </h3>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {products.map((product) => (
                <div
                  key={product.sku}
                  className="border border-gray-200 rounded-lg p-4 hover:border-primary-500 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => handleSelectProduct(product)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        {product.image && (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-16 h-16 object-contain rounded border border-gray-200"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{product.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {product.manufacturer} {product.model && `• ${product.model}`}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-gray-500">SKU: {product.sku}</span>
                            {product.category && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                {product.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary-600">
                        ${product.price?.sale || product.price?.list || 'N/A'}
                      </div>
                      {product.price?.sale && product.price?.list && product.price.sale < product.price.list && (
                        <div className="text-xs text-gray-500 line-through">
                          ${product.price.list}
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectProduct(product);
                        }}
                        className="btn btn-sm btn-primary mt-2"
                      >
                        Select
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {searchTerm && !isLoading && (!products || products.length === 0) && (
          <div className="text-center py-12 text-gray-500">
            <FiSearch size={48} className="mx-auto mb-4 opacity-30" />
            <p>No products found</p>
            <p className="text-sm mt-2">Try a different search term or category</p>
          </div>
        )}

        {!searchTerm && selectedCategory === 'all' && (
          <div className="text-center py-12 text-gray-500">
            <FiShoppingCart size={48} className="mx-auto mb-4 opacity-30" />
            <p>Search for products above</p>
            <p className="text-sm mt-2">Enter a product name or select a category to get started</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CDWProductSelector;

