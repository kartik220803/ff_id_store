import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Spinner from '../components/layout/Spinner';

const EditProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    level: '',
    diamonds: '',
    gold: '',
    loginMethod: '',
    twoStepVerification: '',
    uid: '',
  });

  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    title,
    description,
    price,
    brand,
    model,
    condition,
    age,
    storage,
    color,
    warranty,
    location,
  } = formData;

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`/api/products/${id}`);
        const product = response.data.data;

        // Check if user is the owner of this product
        const userResponse = await axios.get('/api/users/me');
        if (product.seller.toString() !== userResponse.data.data._id) {
          toast.error('You are not authorized to edit this product');
          navigate('/products');
          return;
        }

        setFormData({
          title: product.title,
          description: product.description,
          price: product.price,
          brand: product.brand,
          model: product.model,
          condition: product.condition,
          age: product.age,
          storage: product.storage,
          color: product.color,
          warranty: product.warranty || 'No warranty',
          location: product.location,
        });

        setImages(product.images || []);
        setVideos(product.videos || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching product:', err);
        toast.error('Failed to fetch product details');
        navigate('/products');
      }
    };

    fetchProduct();
  }, [id, navigate]);

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);

    // Validate file types and sizes
    const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    const validFiles = files.filter(file => (
      validImageTypes.includes(file.type) && file.size <= maxSize
    ));

    if (validFiles.length !== files.length) {
      toast.error('Some files were not added. Images must be JPG, JPEG or PNG and less than 5MB.');
      // Continue with valid files only
    }

    if (validFiles.length === 0) return;

    try {
      setUploading(true);

      // Create form data for upload
      const formData = new FormData();
      validFiles.forEach(file => {
        formData.append('files', file);
      });

      // Upload to server
      const response = await axios.post('/api/upload/images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Add uploaded images to state
      setImages([...images, ...response.data]);
      toast.success('Images uploaded successfully');
    } catch (err) {
      console.error('Error uploading images:', err);
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUpload = async (e) => {
    const files = Array.from(e.target.files);

    // Validate file types and sizes
    const validVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    const validFiles = files.filter(file => (
      validVideoTypes.includes(file.type) && file.size <= maxSize
    ));

    if (validFiles.length !== files.length) {
      toast.error('Some files were not added. Videos must be MP4, MOV or AVI and less than 50MB.');
      // Continue with valid files only
    }

    if (validFiles.length === 0) return;

    try {
      setUploading(true);

      // Create form data for upload
      const formData = new FormData();
      validFiles.forEach(file => {
        formData.append('files', file);
      });

      // Upload to server
      const response = await axios.post('/api/upload/videos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Add uploaded videos to state
      setVideos([...videos, ...response.data]);
      toast.success('Videos uploaded successfully');
    } catch (err) {
      console.error('Error uploading videos:', err);
      toast.error('Failed to upload videos');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    const updatedImages = [...images];
    updatedImages.splice(index, 1);
    setImages(updatedImages);
  };

  const removeVideo = (index) => {
    const updatedVideos = [...videos];
    updatedVideos.splice(index, 1);
    setVideos(updatedVideos);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!title || !description || !price || !brand || !model || !condition || !age || !storage || !color || !location) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (images.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }

    try {
      setSaving(true);

      const productData = {
        ...formData,
        price: parseFloat(price),
        images,
        videos
      };

      await axios.put(`/api/products/${id}`, productData);

      toast.success('Product updated successfully');
      navigate(`/products/${id}`);
    } catch (err) {
      console.error('Error updating product:', err);
      toast.error(err.response?.data?.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <section className="edit-product-page">
      <div className="container">
        <div className="section-title">
          <h1>Edit Product Listing</h1>
          <p>Update your product details below</p>
        </div>

        <form className="product-form" onSubmit={handleSubmit}>
          <div className="form-container">
            {/* Basic Information */}
            <div className="form-section">
              <h3>Basic Information</h3>

              <div className="form-group">
                <label htmlFor="title">Title*</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={title}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="e.g., Samsung Galaxy S21 Ultra 5G"
                  maxLength="100"
                  required
                />
                <small className="form-text">Include key details like brand, model, and storage</small>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description*</label>
                <textarea
                  id="description"
                  name="description"
                  value={description}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Describe your phone's condition, any accessories included, reason for selling, etc."
                  rows="6"
                  maxLength="1000"
                  required
                />
                <small className="form-text">Maximum 1000 characters</small>
              </div>

              <div className="form-group">
                <label htmlFor="price">Price (₹)*</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={price}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter price in ₹"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="location">Location*</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={location}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="City, State"
                  required
                />
              </div>
            </div>

            {/* Phone Specifications */}
            <div className="form-section">
              <h3>Phone Specifications</h3>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="brand">Brand*</label>
                  <select
                    id="brand"
                    name="brand"
                    value={brand}
                    onChange={handleChange}
                    className="form-control"
                    required
                  >
                    <option value="">Select Brand</option>
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

                <div className="form-group">
                  <label htmlFor="model">Model*</label>
                  <input
                    type="text"
                    id="model"
                    name="model"
                    value={model}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="e.g., Galaxy S21, iPhone 13"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="condition">Condition*</label>
                  <select
                    id="condition"
                    name="condition"
                    value={condition}
                    onChange={handleChange}
                    className="form-control"
                    required
                  >
                    <option value="">Select Condition</option>
                    <option value="Brand New">Brand New</option>
                    <option value="Like New">Like New</option>
                    <option value="Very Good">Very Good</option>
                    <option value="Good">Good</option>
                    <option value="Acceptable">Acceptable</option>
                    <option value="For Parts">For Parts</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="age">Age*</label>
                  <input
                    type="text"
                    id="age"
                    name="age"
                    value={age}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="e.g., 6 months, 2 years"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="storage">Storage*</label>
                  <input
                    type="text"
                    id="storage"
                    name="storage"
                    value={storage}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="e.g., 64GB, 128GB"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="color">Color*</label>
                  <input
                    type="text"
                    id="color"
                    name="color"
                    value={color}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="e.g., Black, Midnight Blue"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="warranty">Warranty</label>
                <input
                  type="text"
                  id="warranty"
                  name="warranty"
                  value={warranty}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="e.g., 3 months remaining, No warranty"
                />
              </div>
            </div>

            {/* Media Upload */}
            <div className="form-section">
              <h3>Media Files</h3>

              <div className="form-group">
                <label>
                  Current Images*
                  <span className="form-text"> (At least one image required)</span>
                </label>

                {images.length > 0 ? (
                  <div className="uploaded-images">
                    {images.map((image, index) => (
                      <div key={index} className="uploaded-image">
                        <img src={image.url} alt={`Uploaded ${index + 1}`} />
                        <button
                          type="button"
                          className="remove-btn"
                          onClick={() => removeImage(index)}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-media-message">No images uploaded yet</p>
                )}
              </div>

              <div className="form-group">
                <label>Add More Images</label>
                <div className="upload-container">
                  <input
                    type="file"
                    id="images"
                    onChange={handleImageUpload}
                    className="file-input"
                    accept="image/jpeg, image/png, image/jpg"
                    multiple
                    disabled={uploading}
                  />
                  <label htmlFor="images" className="file-label">
                    <i className="fas fa-camera"></i> Choose Images
                  </label>
                  <span className="file-info">JPG, JPEG or PNG, max 5MB each</span>
                </div>

                {uploading && <div className="uploading-message">Uploading...</div>}
              </div>

              <div className="form-group">
                <label>Current Videos</label>

                {videos.length > 0 ? (
                  <div className="uploaded-videos">
                    {videos.map((video, index) => (
                      <div key={index} className="uploaded-video">
                        <video controls>
                          <source src={video.url} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                        <button
                          type="button"
                          className="remove-btn"
                          onClick={() => removeVideo(index)}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-media-message">No videos uploaded</p>
                )}
              </div>

              <div className="form-group">
                <label>Add More Videos</label>
                <div className="upload-container">
                  <input
                    type="file"
                    id="videos"
                    onChange={handleVideoUpload}
                    className="file-input"
                    accept="video/mp4, video/quicktime, video/x-msvideo"
                    multiple
                    disabled={uploading}
                  />
                  <label htmlFor="videos" className="file-label">
                    <i className="fas fa-video"></i> Choose Videos
                  </label>
                  <span className="file-info">MP4, MOV or AVI, max 50MB each</span>
                </div>

                {uploading && <div className="uploading-message">Uploading...</div>}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(`/products/${id}`)}
              disabled={saving || uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || uploading}
            >
              {saving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default EditProductPage;
