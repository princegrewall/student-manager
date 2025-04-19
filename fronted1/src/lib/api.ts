// API base URL
const API_URL = 'http://localhost:5001/api';

/**
 * Helper function to handle API requests
 */
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  // Get auth token from localStorage
  const token = localStorage.getItem('token');

  // Set default headers
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Don't set Content-Type for FormData requests
  const isFormData = options.body instanceof FormData;
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  // Log request details
  console.log(`API Request: ${options.method || 'GET'} ${endpoint}`);
  console.log('Is FormData:', isFormData);
  console.log('Has Auth Token:', !!token);

  try {
    // Add timeout control
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    // Make the request
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    console.log(`Response status: ${response.status} ${response.statusText}`);

    // Parse the JSON response (even for error responses)
    const data = await response.json().catch(() => ({
      message: `Server returned ${response.status} ${response.statusText}`
    }));

    // If response is not ok, throw an error with the message from the server
    if (!response.ok) {
      // Special handling for 404 errors
      if (response.status === 404) {
        console.error('Resource not found:', endpoint);
        throw new Error(data.message || 'Resource not found. Please check if the endpoint is correct.');
      }
      
      // Special handling for database connection issues
      if (response.status === 500 && data.message?.includes('MongoDB')) {
        throw new Error('Database connection error. Please contact the administrator.');
      }
      
      throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
    }

    return data;
  } catch (error: any) {
    console.error('API request error:', error);
    
    // Handle specific network errors for better user feedback
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. The server may be down or overloaded.');
    }
    
    if (!navigator.onLine) {
      throw new Error('You appear to be offline. Please check your internet connection.');
    }
    
    if (error.message && error.message.includes('Failed to fetch')) {
      throw new Error('Could not connect to the server. Please make sure the backend is running.');
    }
    
    // Re-throw the original error with its message
    throw error;
  }
}

// Auth API
export const authAPI = {
  // Register a new user based on role
  register: (userData: { name: string; email: string; password: string; role?: string }, endpoint = 'register') => {
    return apiRequest(`/auth/${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Login a user based on role
  login: async (
    email: string,
    password: string,
    endpoint = 'login'
  ): Promise<{ token: string }> => {
    try {
      console.log(`Attempting login with endpoint: /auth/${endpoint}`);
      const response = await fetch(`${API_URL}/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Login failed:', error);
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Login failed');
    }
  },

  // Get current user profile
  getProfile: () => {
    return apiRequest('/auth/me');
  },
};

// Clubs API
export const clubsAPI = {
  // Get all clubs
  getClubs: () => {
    return apiRequest('/clubs')
      .then(response => {
        // Check if response has the expected structure
        return response.data || response;
      })
      .catch(error => {
        console.error('Error fetching clubs:', error);
        return [];
      });
  },

  // Get a specific club by type
  getClub: (type: string) => {
    return apiRequest(`/clubs/${type}`)
      .then(response => {
        // Handle the response format - API returns {success, data}
        return response.data || response;
      })
      .catch(error => {
        console.error(`Error fetching club ${type}:`, error);
        return null;
      });
  },

  // Check if the current user is a member of a club
  isClubMember: (type: string) => {
    // Normalize the club type to match backend expectations
    const clubType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    console.log(`Checking if user is a member of club: ${clubType}`);
    
    return apiRequest(`/clubs/${clubType}/is-member`)
      .then(response => {
        console.log(`Club membership check result:`, response);
        return response.isMember || false;
      })
      .catch(error => {
        console.error(`Error checking club membership:`, error);
        return false;
      });
  },

  // Join a club
  joinClub: (type: string) => {
    return apiRequest(`/clubs/${type}/join`, {
      method: 'PUT',
    })
      .then(response => {
        // Handle the response format - API returns {success, data}
        return response.data || response;
      })
      .catch(error => {
        console.error(`Error joining club ${type}:`, error);
        throw error;
      });
  },

  // Add a student to a club (by email)
  addStudentToClub: (type: string, email: string) => {
    // Normalize the club type to match backend expectations
    const clubType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    console.log(`Adding student with email ${email} to club: ${clubType}`);
    
    return apiRequest(`/clubs/${clubType}/add-student`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
      .then(response => {
        console.log(`Successfully added student to ${clubType} club:`, response);
        return response.data || response;
      })
      .catch(error => {
        console.error(`Error adding student to club ${clubType}:`, error);
        throw error;
      });
  },

  // Leave a club
  leaveClub: (type: string) => {
    return apiRequest(`/clubs/${type}/leave`, {
      method: 'PUT',
    })
      .then(response => {
        // Handle the response format - API returns {success, data}
        return response.data || response;
      })
      .catch(error => {
        console.error(`Error leaving club ${type}:`, error);
        throw error;
      });
  },

  // Get all members of a club
  getClubMembers: (type: string) => {
    // Convert to proper case format to match backend expectations
    const clubType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    console.log(`Fetching members for club type: ${clubType}`);
    
    return apiRequest(`/clubs/${clubType}/members`)
      .catch(error => {
        console.error(`Error fetching members for club ${type}:`, error);
        // Return empty array instead of throwing to avoid breaking the UI
        return [];
      });
  },

  // Get all subclubs for a specific club type
  getSubclubs: (clubType: string) => {
    const normalizedType = clubType.charAt(0).toUpperCase() + clubType.slice(1).toLowerCase();
    console.log(`Fetching subclubs for club type: ${normalizedType}`);
    
    return apiRequest(`/clubs/${normalizedType}/subclubs`)
      .then(response => {
        console.log(`Got subclubs for ${normalizedType}:`, response);
        return response.data || [];
      })
      .catch(error => {
        console.error(`Error fetching subclubs for ${normalizedType}:`, error);
        return [];
      });
  },
  
  // Get all members of a specific subclub
  getSubclubMembers: (clubType: string, subclubName: string) => {
    const normalizedType = clubType.charAt(0).toUpperCase() + clubType.slice(1).toLowerCase();
    console.log(`Fetching members for subclub ${subclubName} in ${normalizedType} club`);
    
    return apiRequest(`/clubs/${normalizedType}/subclubs/${encodeURIComponent(subclubName)}/members`)
      .then(response => {
        console.log(`Got members for subclub ${subclubName}:`, response);
        return response.data || [];
      })
      .catch(error => {
        console.error(`Error fetching members for subclub ${subclubName}:`, error);
        return [];
      });
  },
  
  // Join a specific subclub
  joinSubclub: (clubType: string, subclubName: string) => {
    const normalizedType = clubType.charAt(0).toUpperCase() + clubType.slice(1).toLowerCase();
    console.log(`Joining subclub ${subclubName} in ${normalizedType} club`);
    
    return apiRequest(`/clubs/${normalizedType}/subclubs/${encodeURIComponent(subclubName)}/join`, {
      method: 'PUT'
    })
      .then(response => {
        console.log(`Successfully joined subclub ${subclubName}:`, response);
        return response.data || response;
      })
      .catch(error => {
        console.error(`Error joining subclub ${subclubName}:`, error);
        throw error;
      });
  },
  
  // Check if user is a member of a specific subclub
  isSubclubMember: (clubType: string, subclubName: string) => {
    const normalizedType = clubType.charAt(0).toUpperCase() + clubType.slice(1).toLowerCase();
    console.log(`Checking membership for subclub ${subclubName} in ${normalizedType} club`);
    
    return apiRequest(`/clubs/${normalizedType}/subclubs/${encodeURIComponent(subclubName)}/is-member`)
      .then(response => {
        console.log(`Membership check for subclub ${subclubName}:`, response);
        return response.isMember || false;
      })
      .catch(error => {
        console.error(`Error checking membership for subclub ${subclubName}:`, error);
        return false;
      });
  },
  
  // Create a new subclub
  createSubclub: (clubType: string, subclubData: { name: string, description?: string }) => {
    const normalizedType = clubType.charAt(0).toUpperCase() + clubType.slice(1).toLowerCase();
    console.log(`Creating new subclub in ${normalizedType} club:`, subclubData);
    
    return apiRequest(`/clubs/${normalizedType}/subclubs`, {
      method: 'POST',
      body: JSON.stringify(subclubData)
    })
      .then(response => {
        console.log(`Successfully created subclub:`, response);
        return response.data || response;
      })
      .catch(error => {
        console.error(`Error creating subclub:`, error);
        throw error;
      });
  },
  
  // Delete a specific subclub (coordinators only)
  deleteSubclub: (clubType: string, subclubName: string) => {
    const normalizedType = clubType.charAt(0).toUpperCase() + clubType.slice(1).toLowerCase();
    console.log(`Attempting to delete subclub ${subclubName} from club ${normalizedType}`);
    
    return apiRequest(`/clubs/${normalizedType}/subclubs/${encodeURIComponent(subclubName)}`, {
      method: 'DELETE'
    })
      .then(response => {
        console.log(`Successfully deleted subclub ${subclubName} from club ${normalizedType}:`, response);
        return response.data || response;
      })
      .catch(error => {
        console.error(`Error deleting subclub ${subclubName} from club ${normalizedType}:`, error);
        throw error;
      });
  },
  
  // Delete a club (coordinators only)
  deleteClub: (type: string) => {
    const normalizedType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    console.log(`Attempting to delete club: ${normalizedType}`);
    
    return apiRequest(`/clubs/${normalizedType}`, {
      method: 'DELETE'
    })
      .then(response => {
        console.log(`Successfully deleted club ${normalizedType}:`, response);
        return response.data || response;
      })
      .catch(error => {
        console.error(`Error deleting club ${normalizedType}:`, error);
        throw error;
      });
  },
  
  // Remove a student from a subclub (coordinators only)
  removeStudentFromSubclub: (clubType: string, subclubName: string, studentId: string) => {
    const normalizedType = clubType.charAt(0).toUpperCase() + clubType.slice(1).toLowerCase();
    console.log(`Attempting to remove student ${studentId} from subclub ${subclubName} in club ${normalizedType}`);
    
    return apiRequest(`/clubs/${normalizedType}/subclubs/${encodeURIComponent(subclubName)}/members/${studentId}`, {
      method: 'DELETE'
    })
      .then(response => {
        console.log(`Successfully removed student from subclub ${subclubName}:`, response);
        return response.data || response;
      })
      .catch(error => {
        console.error(`Error removing student from subclub ${subclubName}:`, error);
        throw error;
      });
  }
};

// Events API
export const eventsAPI = {
  // Get all events
  getEvents: (clubType?: string) => {
    const query = clubType ? `?clubType=${clubType}` : '';
    return apiRequest(`/events${query}`)
      .catch(error => {
        console.error(`Error fetching events${clubType ? ` for club ${clubType}` : ''}:`, error);
        return [];
      });
  },

  // Get a specific event
  getEvent: (id: string) => {
    return apiRequest(`/events/${id}`)
      .catch(error => {
        console.error(`Error fetching event ${id}:`, error);
        return null;
      });
  },

  // Create a new event
  createEvent: (eventData: {
    title: string;
    description: string;
    date: string;
    clubType: string;
    location?: string;
  }) => {
    // Convert the club type to proper case
    const formattedEventData = {
      ...eventData,
      clubType: eventData.clubType.charAt(0).toUpperCase() + eventData.clubType.slice(1).toLowerCase()
    };
    
    console.log('Creating event with formatted data:', formattedEventData);
    
    return apiRequest('/events', {
      method: 'POST',
      body: JSON.stringify(formattedEventData),
    });
  },

  // Update an event
  updateEvent: (id: string, eventData: Partial<{
    title: string;
    description: string;
    date: string;
    clubType: string;
    location: string;
  }>) => {
    // If clubType is being updated, ensure it's formatted correctly
    if (eventData.clubType) {
      eventData.clubType = eventData.clubType.charAt(0).toUpperCase() + eventData.clubType.slice(1).toLowerCase();
    }
    
    return apiRequest(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  },

  // Delete an event
  deleteEvent: (id: string) => {
    return apiRequest(`/events/${id}`, {
      method: 'DELETE',
    });
  },
};

// Curriculum API
export const curriculumAPI = {
  // Get all curriculum items
  getCurriculum: (semester?: number) => {
    const query = semester ? `?semester=${semester}` : '';
    return apiRequest(`/curriculum${query}`);
  },

  // Get a specific curriculum item
  getCurriculumItem: (id: string) => {
    return apiRequest(`/curriculum/${id}`);
  },

  // Create a new curriculum item
  createCurriculumItem: async (itemData: {
    title: string;
    semester: number;
    description: string;
    fileLink?: string;
  }, file?: File) => {
    try {
      // Client-side validation
      if (!itemData.title || !itemData.title.trim()) {
        throw new Error('Title is required');
      }
      
      if (!itemData.description || !itemData.description.trim()) {
        throw new Error('Description is required');
      }
      
      if (itemData.semester === undefined || itemData.semester < 1) {
        throw new Error('Valid semester number is required');
      }

      console.log("Creating curriculum item with data:", itemData);
      
      if (file) {
        // Using FormData for file uploads
        const formData = new FormData();
        
        // IMPORTANT: Explicitly add these fields to FormData
        // Make sure to trim values to avoid whitespace issues
        formData.append('title', itemData.title.trim());
        formData.append('semester', String(itemData.semester)); // Ensure it's a string
        formData.append('description', itemData.description.trim());
        formData.append('document', file);
        
        // Debug what's in the FormData - more detailed logging
        console.log("FormData entries:");
        for (const [key, value] of formData.entries()) {
          if (value instanceof File) {
            console.log(`${key}: File (${value.name}, ${value.type}, ${value.size} bytes)`);
          } else {
            console.log(`${key}: "${value}" (${typeof value})`);
          }
        }
        
        try {
          const result = await apiRequest('/curriculum', {
            method: 'POST',
            body: formData,
          });
          console.log("Upload successful:", result);
          return result;
        } catch (error) {
          console.error("Upload failed:", error);
          throw error;
        }
      }
      
      // Clean data for non-file requests
      const cleanData = {
        title: itemData.title.trim(),
        semester: itemData.semester,
        description: itemData.description.trim(),
        fileLink: itemData.fileLink?.trim()
      };
      
      return await apiRequest('/curriculum', {
        method: 'POST',
        body: JSON.stringify(cleanData),
      });
    } catch (error) {
      console.error('Error creating curriculum item:', error);
      throw error;
    }
  },

  // Update a curriculum item
  updateCurriculumItem: (id: string, itemData: Partial<{
    title: string;
    semester: number;
    description: string;
    fileLink: string;
  }>, file?: File) => {
    if (file) {
      const formData = new FormData();
      if (itemData.title) formData.append('title', itemData.title);
      if (itemData.semester) formData.append('semester', itemData.semester.toString());
      if (itemData.description) formData.append('description', itemData.description);
      formData.append('document', file);
      
      return apiRequest(`/curriculum/${id}`, {
        method: 'PUT',
        body: formData,
      });
    }
    
    return apiRequest(`/curriculum/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
  },

  // Delete a curriculum item
  deleteCurriculumItem: (id: string) => {
    return apiRequest(`/curriculum/${id}`, {
      method: 'DELETE',
    });
  },
};

// Library API
export const libraryAPI = {
  // Get all library items
  getLibraryItems: (search?: string) => {
    const query = search ? `?search=${search}` : '';
    console.log(`Fetching all library items with query: ${query}`);
    
    return apiRequest(`/library${query}`)
      .then(response => {
        console.log('All library items response:', response);
        // Check if response is an array or has a data property
        if (Array.isArray(response)) {
          console.log(`Received ${response.length} books from API`);
          
          // Log addedBy info for each book for debugging
          response.forEach((book, index) => {
            const addedByInfo = typeof book.addedBy === 'object' 
              ? `ID: ${book.addedBy?._id || book.addedBy?.id || 'Unknown'}, Name: ${book.addedBy?.name || 'Unknown'}` 
              : `ID: ${book.addedBy}`;
            console.log(`Book ${index + 1}: "${book.title}" - Added by: ${addedByInfo}`);
          });
          
          return response;
        } else if (response.data && Array.isArray(response.data)) {
          console.log(`Received ${response.data.length} books from API (data property)`);
          
          // Log addedBy info for each book for debugging
          response.data.forEach((book, index) => {
            const addedByInfo = typeof book.addedBy === 'object' 
              ? `ID: ${book.addedBy?._id || book.addedBy?.id || 'Unknown'}, Name: ${book.addedBy?.name || 'Unknown'}` 
              : `ID: ${book.addedBy}`;
            console.log(`Book ${index + 1}: "${book.title}" - Added by: ${addedByInfo}`);
          });
          
          return response.data;
        } else {
          console.warn('Unexpected library items response format:', response);
          return [];
        }
      })
      .catch(error => {
        console.error('Error fetching all library items:', error);
        return [];
      });
  },

  // Get library items uploaded by the current user (for teachers)
  getMyLibraryItems: () => {
    console.log('Fetching current user library items...');
    return apiRequest('/library/my-uploads')
      .then(response => {
        console.log('My library items API response:', response);
        
        const result = response.data || response;
        
        if (Array.isArray(result)) {
          console.log(`Received ${result.length} personal library items`);
          
          // Get user ID from localStorage for verification
          const token = localStorage.getItem('token');
          let userId = null;
          
          if (token) {
            try {
              // Extract user ID from token if possible for double-checking ownership
              const tokenData = JSON.parse(atob(token.split('.')[1]));
              userId = tokenData.id;
              console.log('Current user ID from token:', userId);
            } catch (e) {
              console.log('Could not parse token for user ID verification');
            }
          }
          
          // Log each book's ownership info for debugging
          result.forEach((book, index) => {
            const bookOwnerId = typeof book.addedBy === 'object' 
              ? (book.addedBy?._id || book.addedBy?.id) 
              : book.addedBy;
              
            console.log(`MyBook ${index + 1}: "${book.title}" - Owner ID: ${bookOwnerId}`);
            
            if (userId && bookOwnerId !== userId) {
              console.warn(`Warning: Book "${book.title}" has owner ID ${bookOwnerId} but current user ID is ${userId}`);
            }
          });
        }
        
        return result;
      })
      .catch(error => {
        console.error('Error fetching my library items:', error);
        return [];
      });
  },

  // Get a specific library item
  getLibraryItem: (id: string) => {
    return apiRequest(`/library/${id}`);
  },

  // Create a new library item
  createLibraryItem: async (itemData: {
    title: string;
    author: string;
    description?: string;
    link?: string;
    semester?: number;
  }, file?: File) => {
    try {
      // Client-side validation
      if (!itemData.title || !itemData.title.trim()) {
        throw new Error('Title is required');
      }
      
      if (!itemData.author || !itemData.author.trim()) {
        throw new Error('Author is required');
      }

      // Clean input data
      const cleanData = {
        title: itemData.title.trim(),
        author: itemData.author.trim(),
        description: itemData.description?.trim() || '',
        link: itemData.link?.trim() || '',
        semester: itemData.semester || 1
      };

      // Debug the data
      console.log("FormData payload:", cleanData);

      if (file) {
        // Using FormData for file uploads
        const formData = new FormData();
        
        // IMPORTANT: Explicitly add these fields to FormData
        formData.append('title', cleanData.title);
        formData.append('author', cleanData.author);
        formData.append('description', cleanData.description);
        formData.append('link', cleanData.link);
        formData.append('semester', cleanData.semester.toString());
        formData.append('document', file);
        
        // Debug what's in the FormData
        console.log("FormData entries:");
        for (const [key, value] of formData.entries()) {
          console.log(`${key}: ${value instanceof File ? value.name : value}`);
        }
        
        return await apiRequest('/library', {
          method: 'POST',
          body: formData
        });
      }
      
      // Remove undefined fields for cleaner request
      const requestData: any = {};
      Object.entries(cleanData).forEach(([key, value]) => {
        if (value !== undefined) {
          requestData[key] = value;
        }
      });
      
      return await apiRequest('/library', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });
    } catch (error) {
      console.error('Error creating library item:', error);
      throw error;
    }
  },

  // Update a library item
  updateLibraryItem: (id: string, itemData: Partial<{
    title: string;
    author: string;
    link: string;
    description: string;
    semester: number;
  }>, file?: File) => {
    if (file) {
      const formData = new FormData();
      if (itemData.title) formData.append('title', itemData.title.trim());
      if (itemData.author) formData.append('author', itemData.author.trim());
      if (itemData.description) formData.append('description', itemData.description.trim());
      if (itemData.link) formData.append('link', itemData.link.trim());
      if (itemData.semester) formData.append('semester', itemData.semester.toString());
      formData.append('document', file);
      
      return apiRequest(`/library/${id}`, {
        method: 'PUT',
        body: formData,
      });
    }
    
    // Clean the data before sending
    const cleanData: any = {};
    Object.entries(itemData).forEach(([key, value]) => {
      if (typeof value === 'string') {
        cleanData[key] = value.trim();
      } else if (value !== undefined) {
        cleanData[key] = value;
      }
    });
    
    return apiRequest(`/library/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cleanData),
    });
  },

  // Delete a library item
  deleteLibraryItem: (id: string) => {
    return apiRequest(`/library/${id}`, {
      method: 'DELETE',
    })
    .then(response => {
      console.log('Successfully deleted library item:', response);
      return response;
    })
    .catch(error => {
      console.error('Error deleting library item:', error);
      
      // Check if this is a permission denied error
      if (error.message && (
        error.message.includes('Not authorized') || 
        error.message.includes('authorized to delete')
      )) {
        error.permissionDenied = true;
      }
      
      throw error;
    });
  },
};

// Attendance API
export const attendanceAPI = {
  // Get all subjects
  getSubjects: () => {
    return apiRequest('/attendance/subjects');
  },

  // Create a new subject
  createSubject: (name: string) => {
    return apiRequest('/attendance/subjects', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  // Delete a subject
  deleteSubject: (id: string) => {
    return apiRequest(`/attendance/subjects/${id}`, {
      method: 'DELETE',
    });
  },

  // Get attendance records for a subject
  getAttendanceRecords: (subjectId: string) => {
    return apiRequest(`/attendance/subjects/${subjectId}/records`);
  },

  // Mark attendance for a subject
  markAttendance: (subjectId: string, status: 'Present' | 'Absent', date?: string) => {
    return apiRequest(`/attendance/subjects/${subjectId}/records`, {
      method: 'POST',
      body: JSON.stringify({ status, date }),
    });
  },

  // Delete an attendance record
  deleteAttendanceRecord: (id: string) => {
    return apiRequest(`/attendance/records/${id}`, {
      method: 'DELETE',
    });
  },

  // Get attendance percentage for a subject
  getAttendancePercentage: (subjectId: string) => {
    return apiRequest(`/attendance/subjects/${subjectId}/percentage`);
  },

  // Get attendance percentage for all subjects
  getAllAttendancePercentages: () => {
    return apiRequest('/attendance/percentage');
  },
};

// Admin API
export const adminAPI = {
  // Get all students 
  getAllStudents: async () => {
    try {
      const response = await apiRequest('/admin/students');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  },

  // Add a student to a club
  addStudentToClub: async (email: string, clubType: string, subclubName?: string) => {
    try {
      // Normalize club type for consistency
      const normalizedClubType = clubType.charAt(0).toUpperCase() + clubType.slice(1).toLowerCase();
      
      const payload: any = { 
        email, 
        clubType: normalizedClubType 
      };
      
      if (subclubName) {
        // Keep the exact subclub name as provided in UI for matching
        payload.subclubName = subclubName;
      }
      
      console.log(`API call: Adding student ${email} to ${normalizedClubType} club${subclubName ? ` (subclub: ${subclubName})` : ''}`);
      
      const response = await apiRequest('/admin/club/add-student', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      return response.data || response;
    } catch (error) {
      console.error('Error adding student to club:', error);
      throw error;
    }
  },
};