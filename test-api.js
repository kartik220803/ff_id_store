const axios = require('axios');

// Test the API endpoints
async function testAPI() {
    const baseURL = 'http://localhost:5000/api';

    try {
        // Test basic connection
        console.log('Testing basic server connection...');
        const healthResponse = await axios.get(`${baseURL}/products`);
        console.log('✅ Server is responding');

        // Note: We would need a valid token to test authenticated endpoints
        console.log('API base URL:', baseURL);
        console.log('Products endpoint test completed');

    } catch (error) {
        console.error('❌ API Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testAPI();
