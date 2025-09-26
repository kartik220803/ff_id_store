import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { productAPI } from '../services';
import ProductCard from '../components/products/ProductCard';
import Spinner from '../components/layout/Spinner';

const ProductListingPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    minLevel: '',
    maxLevel: '',
    minDiamonds: '',
    maxDiamonds: '',
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
      status: queryParams.status || '',
      minLevel: queryParams.minLevel || '',
      maxLevel: queryParams.maxLevel || '',
      minDiamonds: queryParams.minDiamonds || '',
      maxDiamonds: queryParams.maxDiamonds || '',
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
        if (filters.status) query.append('status', filters.status);
        if (filters.minLevel) query.append('minLevel', filters.minLevel);
        if (filters.maxLevel) query.append('maxLevel', filters.maxLevel);
        if (filters.minDiamonds) query.append('minDiamonds', filters.minDiamonds);
        if (filters.maxDiamonds) query.append('maxDiamonds', filters.maxDiamonds);
        if (filters.minPrice) query.append('minPrice', filters.minPrice);
        if (filters.maxPrice) query.append('maxPrice', filters.maxPrice);
        if (filters.sort) query.append('sort', filters.sort);
        if (filters.search) query.append('search', filters.search);
        if (filters.featured) query.append('featured', filters.featured);
        query.append('page', page);
        query.append('limit', limit);

        const response = await productAPI.getAllProducts(Object.fromEntries(query));

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
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.minLevel) queryParams.append('minLevel', filters.minLevel);
    if (filters.maxLevel) queryParams.append('maxLevel', filters.maxLevel);
    if (filters.minDiamonds) queryParams.append('minDiamonds', filters.minDiamonds);
    if (filters.maxDiamonds) queryParams.append('maxDiamonds', filters.maxDiamonds);
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
          <h1>Free Fire Accounts</h1>
          <p>Find the perfect Free Fire account at the best price</p>
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
                    placeholder="Search by UID, Level, Price, etc."
                  />
                </div>
              </div>

              <div className="filter-section">
                <h3>Availability</h3>
                <div className="form-group">
                  <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="form-control"
                  >
                    <option value="">All Accounts</option>
                    <option value="available">Available</option>
                    <option value="sold">Sold</option>
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
                    placeholder="Min ₹"
                    min="0"
                  />
                  <span>to</span>
                  <input
                    type="number"
                    name="maxPrice"
                    value={filters.maxPrice}
                    onChange={handleFilterChange}
                    className="form-control"
                    placeholder="Max ₹"
                    min="0"
                  />
                </div>
              </div>

              <div className="filter-section">
                <h3>Level Range</h3>
                <div className="form-group price-range">
                  <input
                    type="number"
                    name="minLevel"
                    value={filters.minLevel}
                    onChange={handleFilterChange}
                    className="form-control"
                    placeholder="Min Level"
                    min="1"
                    max="100"
                  />
                  <span>to</span>
                  <input
                    type="number"
                    name="maxLevel"
                    value={filters.maxLevel}
                    onChange={handleFilterChange}
                    className="form-control"
                    placeholder="Max Level"
                    min="1"
                    max="100"
                  />
                </div>
              </div>

              <div className="filter-section">
                <h3>Diamonds Range</h3>
                <div className="form-group price-range">
                  <input
                    type="number"
                    name="minDiamonds"
                    value={filters.minDiamonds}
                    onChange={handleFilterChange}
                    className="form-control"
                    placeholder="Min"
                    min="0"
                  />
                  <span>to</span>
                  <input
                    type="number"
                    name="maxDiamonds"
                    value={filters.maxDiamonds}
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
                    <option value="-level">Level High to Low</option>
                    <option value="level">Level Low to High</option>
                    <option value="-diamonds">Diamonds High to Low</option>
                    <option value="diamonds">Diamonds Low to High</option>
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
