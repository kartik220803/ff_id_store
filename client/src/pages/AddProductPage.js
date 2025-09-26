import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { productAPI, uploadAPI } from '../services';
import Spinner from '../components/layout/Spinner';

const AddProductPage = () => {
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
  const [loading, setLoading] = useState(false);

  const {
    title,
    description,
    price,
    level,
    diamonds,
    gold,
    loginMethod,
    twoStepVerification,
    uid,
  } = formData;

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

    if (validFiles.length === 0) return; try {
      setUploading(true);

      // Create form data for upload
      const formData = new FormData();
      validFiles.forEach(file => {
        formData.append('images', file);
      });

      // Upload to server
      const response = await uploadAPI.uploadImages(formData);

      // Add uploaded images to state
      setImages([...images, ...response.data.data]);
      toast.success('Images uploaded successfully');
    } catch (err) {
      console.error('Error uploading images:', err);
      console.error('Error response:', err.response?.data);
      toast.error(err.response?.data?.message || 'Failed to upload images');
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

    if (validFiles.length === 0) return; try {
      setUploading(true);

      // Create form data for upload
      const formData = new FormData();
      validFiles.forEach(file => {
        formData.append('videos', file);
      });

      // Upload to server
      const response = await uploadAPI.uploadVideos(formData);

      // Add uploaded videos to state
      setVideos([...videos, ...response.data.data]);
      toast.success('Videos uploaded successfully');
    } catch (err) {
      console.error('Error uploading videos:', err);
      console.error('Error response:', err.response?.data);
      toast.error(err.response?.data?.message || 'Failed to upload videos');
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
    if (!title || !description || !price || !level || !diamonds || !gold || !twoStepVerification || !loginMethod || !uid) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (images.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }

    try {
      setLoading(true);

      const productData = {
        ...formData,
        price: parseFloat(price),
        level: parseInt(level),
        diamonds: parseInt(diamonds),
        gold: parseInt(gold),
        images,
        videos
      };

      await productAPI.createProduct(productData);

      toast.success('Free Fire account listed successfully');
      navigate('/products');
    } catch (err) {
      console.error('Error adding product:', err);
      toast.error(err.response?.data?.message || 'Failed to list account');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <section className="add-product-page">
      <div className="container">
        <div className="section-title">
          <h1>Sell Your Free Fire Account</h1>
          <p>Fill in the details and upload screenshots to list your account</p>
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
                  placeholder="e.g., 75 Level Account"
                  maxLength="100"
                  required
                />
                <small className="form-text">Include key details like level, rank, and special items</small>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description*</label>
                <textarea
                  id="description"
                  name="description"
                  value={description}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="5 years old, 300 diamonds, 75 level, 5 evo guns"
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
            </div>

            {/* Account Details */}
            <div className="form-section">
              <h3>Account Details</h3>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="level">Level*</label>
                  <input
                    type="number"
                    id="level"
                    name="level"
                    value={level}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="e.g., 75"
                    min="1"
                    max="100"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="diamonds">Diamonds*</label>
                  <input
                    type="number"
                    id="diamonds"
                    name="diamonds"
                    value={diamonds}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="e.g., 5000"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="gold">Gold*</label>
                <input
                  type="number"
                  id="gold"
                  name="gold"
                  value={gold}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="e.g., 150000"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="loginMethod">Login Method*</label>
                <select
                  id="loginMethod"
                  name="loginMethod"
                  value={loginMethod}
                  onChange={handleChange}
                  className="form-control"
                  required
                >
                  <option value="">Select Login Method</option>
                  <option value="Facebook">🌐 Facebook</option>
                  <option value="Google">🔍 Google</option>
                  <option value="X/Twitter">✖️ X/Twitter</option>
                  <option value="Guest">👤 Guest</option>
                </select>
                <small className="form-text">Select the primary login method for this account</small>
              </div>

              <div className="form-group">
                <label htmlFor="twoStepVerification">2-Step Verification*</label>
                <select
                  id="twoStepVerification"
                  name="twoStepVerification"
                  value={twoStepVerification}
                  onChange={handleChange}
                  className="form-control"
                  required
                >
                  <option value="">Select Status</option>
                  <option value="Enabled">Enabled</option>
                  <option value="Not Enabled">Not Enabled</option>
                </select>
                <small className="form-text">Indicate if 2-step verification is enabled on this account</small>
              </div>

              <div className="form-group">
                <label htmlFor="uid">Account UID*</label>
                <input
                  type="text"
                  id="uid"
                  name="uid"
                  value={uid}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter account UID (8-15 characters)"
                  minLength="8"
                  maxLength="15"
                  required
                />
                <small className="form-text">Unique identifier for this Free Fire account</small>
              </div>
            </div>

            {/* Media Upload */}
            <div className="form-section">
              <h3>Upload Screenshots & Videos</h3>

              <div className="form-group">
                <label>
                  Screenshots*
                  <span className="form-text"> (Upload at least one screenshot)</span>
                </label>
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
                    <i className="fas fa-camera"></i> Choose Screenshots
                  </label>
                  <span className="file-info">JPG, JPEG or PNG, max 5MB each</span>
                </div>
                <small className="form-text">Include screenshots of level, inventory, skins, and other valuable items</small>

                {uploading && <div className="uploading-message">Uploading...</div>}

                {images.length > 0 && (
                  <div className="uploaded-images">
                    {images.map((image, index) => (
                      <div key={index} className="uploaded-image">
                        <img src={image.url} alt={`Screenshot ${index + 1}`} />
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
                )}
              </div>

              <div className="form-group">
                <label>
                  Videos
                  <span className="form-text"> (Optional)</span>
                </label>
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
                <small className="form-text">Upload gameplay videos to showcase account features</small>

                {uploading && <div className="uploading-message">Uploading...</div>}

                {videos.length > 0 && (
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
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/products')}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || uploading}
            >
              {loading ? 'Listing Account...' : 'List Account'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default AddProductPage;
