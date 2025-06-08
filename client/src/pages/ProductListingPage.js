import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/products/ProductCard';
import Spinner from '../components/layout/Spinner';

const ProductListingPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    brand: '',
    condition: '',
    minPrice: '',
    maxPrice: '',
    sort: '-createdAt',
  });

  const location = useLocation();
  const navigate = useNavigate();
  const limit = 12;

  // Parse URL query parameters
  const getQueryParams = () => {
    const searchParams = new URLSearchParams(location.search);
    const params = {};

    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }

    return params;
  };

  // Initialize filters from URL
  useEffect(() => {
    const queryParams = getQueryParams();

    setFilters({
      brand: queryParams.brand || '',
      condition: queryParams.condition || '',
      minPrice: queryParams.minPrice || '',
      maxPrice: queryParams.maxPrice || '',
      sort: queryParams.sort || '-createdAt',
      search: queryParams.search || '',
      featured: queryParams.featured || '',
    });

    if (queryParams.page) {
      setPage(parseInt(queryParams.page, 10));
    } else {
      setPage(1);
    }
  }, [location.search]);

  // Fetch products when filters or page change
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // Build query string from filters
        const query = new URLSearchParams();
        if (filters.brand) query.append('brand', filters.brand);
        if (filters.condition) query.append('condition', filters.condition);
        if (filters.minPrice) query.append('minPrice', filters.minPrice);
        if (filters.maxPrice) query.append('maxPrice', filters.maxPrice);
        if (filters.sort) query.append('sort', filters.sort);
        if (filters.search) query.append('search', filters.search);
        if (filters.featured) query.append('featured', filters.featured);
        query.append('page', page);
        query.append('limit', limit);
        
        const response = await axios.get(`/api/products?${query.toString()}`);
        
        setProducts(response.data.data);
        setTotalPages(Math.ceil(response.data.total / limit));
        setLoading(false);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again later.');
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filters, page]);

  // Handle filter change
  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
    setPage(1); // Reset to page 1 when filters change
  };

  // Handle search input
  const handleSearch = (e) => {
    e.preventDefault();
    
    // Build query params
    const queryParams = new URLSearchParams();
    if (filters.brand) queryParams.append('brand', filters.brand);
    if (filters.condition) queryParams.append('condition', filters.condition);
    if (filters.minPrice) queryParams.append('minPrice', filters.minPrice);
    if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice);
    if (filters.sort) queryParams.append('sort', filters.sort);
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.featured) queryParams.append('featured', filters.featured);
    
    // Navigate with updated query params
    navigate(`/products?${queryParams.toString()}`);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    
    const queryParams = getQueryParams();
    queryParams.page = newPage;
    
    navigate(`/products?${new URLSearchParams(queryParams).toString()}`);
  };

  if (loading && page === 1) {
    return <Spinner />;
  }

  return (
    <section className="products-page">
      <div className="container">
        <div className="section-title">
          <h1>Mobile Phones</h1>
          <p>Find the perfect second-hand smartphone at the best price</p>
        </div>

        <div className="products-layout">
          {/* Filters Sidebar */}
          <div className="filters-sidebar">
            <form onSubmit={handleSearch}>
              <div className="filter-section">
                <h3>Search</h3>
                <div className="form-group">
                  <input
                    type="text"
                    name="search"
                    value={filters.search || ''}
                    onChange={handleFilterChange}
                    className="form-control"
                    placeholder="Search phones..."
                  />
                </div>
              </div>

              <div className="filter-section">
                <h3>Brand</h3>
                <div className="form-group">
                  <select
                    name="brand"
                    value={filters.brand}
                    onChange={handleFilterChange}
                    className="form-control"
                  >
                    <option value="">All Brands</option>
                    <option value="Apple">Apple</option>
                    <option value="Samsung">Samsung</option>
                    <option value="Google">Google</option>
                    <option value="OnePlus">OnePlus</option>
                    <option value="Xiaomi">Xiaomi</option>
                    <option value="Oppo">Oppo</option>
                    <option value="Vivo">Vivo</option>
                    <option value="Realme">Realme</option>
                    <option value="Motorola">Motorola</option>
                    <option value="Nokia">Nokia</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="filter-section">
                <h3>Condition</h3>
                <div className="form-group">
                  <select
                    name="condition"
                    value={filters.condition}
                    onChange={handleFilterChange}
                    className="form-control"
                  >
                    <option value="">All Conditions</option>
                    <option value="Brand New">Brand New</option>
                    <option value="Like New">Like New</option>
                    <option value="Very Good">Very Good</option>
                    <option value="Good">Good</option>
                    <option value="Acceptable">Acceptable</option>
                    <option value="For Parts">For Parts</option>
                  </select>
                </div>
              </div>

              <div className="filter-section">
                <h3>Price Range</h3>
                <div className="form-group price-range">
                  <input
                    type="number"
                    name="minPrice"
                    value={filters.minPrice}
                    onChange={handleFilterChange}
                    className="form-control"
                    placeholder="Min"
                    min="0"
                  />
                  <span>to</span>
                  <input
                    type="number"
                    name="maxPrice"
                    value={filters.maxPrice}
                    onChange={handleFilterChange}
                    className="form-control"
                    placeholder="Max"
                    min="0"
                  />
                </div>
              </div>

              <div className="filter-section">
                <h3>Sort By</h3>
                <div className="form-group">
                  <select
                    name="sort"
                    value={filters.sort}
                    onChange={handleFilterChange}
                    className="form-control"
                  >
                    <option value="-createdAt">Newest First</option>
                    <option value="createdAt">Oldest First</option>
                    <option value="price">Price Low to High</option>
                    <option value="-price">Price High to Low</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-block">
                Apply Filters
              </button>
            </form>
          </div>

          {/* Products Grid */}
          <div className="products-container">
            {error ? (
              <div className="error-message">{error}</div>
            ) : products.length === 0 ? (
              <div className="no-products">
                <h3>No products found</h3>
                <p>Try adjusting your search criteria</p>
              </div>
            ) : (
              <>
                <div className="product-grid">
                  {products.map(product => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="btn btn-outline pagination-btn"
                    >
                      Previous
                    </button>
                    
                    <div className="page-numbers">
                      <span>
                        Page {page} of {totalPages}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                      className="btn btn-outline pagination-btn"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductListingPage;
