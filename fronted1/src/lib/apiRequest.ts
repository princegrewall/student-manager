// Custom API request function that provides additional debugging

/**
 * Makes a direct API request to the server with detailed logging
 * This can be used for testing and debugging API issues
 */
export async function makeDirectApiRequest(endpoint: string, formData: FormData) {
  const API_URL = 'http://localhost:5001/api';
  const token = localStorage.getItem('token');
  
  console.log(`Making direct API request to: ${API_URL}${endpoint}`);
  console.log('Form data contents:');
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      console.log(`${key}: File (${value.name}, ${value.type}, ${value.size} bytes)`);
    } else {
      console.log(`${key}: "${value}" (${typeof value})`);
    }
  }
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData
    });
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    let responseData: any;
    try {
      responseData = await response.json();
      console.log('Response data:', responseData);
    } catch (e) {
      console.error('Failed to parse response as JSON:', e);
      responseData = { message: 'Failed to parse response' };
    }
    
    if (!response.ok) {
      throw new Error(responseData.message || `Error ${response.status}: ${response.statusText}`);
    }
    
    return responseData;
  } catch (error) {
    console.error('Direct API request error:', error);
    throw error;
  }
} 