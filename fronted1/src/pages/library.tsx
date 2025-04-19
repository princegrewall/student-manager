import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  Download, 
  Search, 
  BookOpen, 
  Upload, 
  Plus, 
  FileUp, 
  RefreshCw,
  Edit,
  Trash2,
  Layers,
  Pencil,
  Folder,
  ChevronDown,
  ChevronRight,
  FolderOpen
} from "lucide-react";
import { libraryAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { toast } from "@/components/ui/use-toast";
import { Clock } from "lucide-react";

interface LibraryItem {
  _id: string;
  title: string;
  author: string;
  link: string;
  description: string;
  addedBy: string | {
    _id: string;
    id?: string;
    name?: string;
  };
  createdAt: string;
  coverImage?: string;
  semester?: number;
}

const Library = () => {
  const { isAuthenticated, hasPermission, user } = useAuth();
  const [books, setBooks] = useState<LibraryItem[]>([]);
  const [myBooks, setMyBooks] = useState<LibraryItem[]>([]);
  const [booksBySemester, setBooksBySemester] = useState<Record<number, LibraryItem[]>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBook, setSelectedBook] = useState<LibraryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    description: '',
    link: '',
    semester: 1
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Check if user has permission to add/edit library content
  const canEditLibrary = hasPermission('crud:library');
  // Users can always view library content
  const canViewLibrary = hasPermission('view:library');
  
  // Check if user is a teacher
  const isTeacher = user?.role === 'teacher';

  // For teacher interface - active tab is now always "my-uploads"
  const [activeTab, setActiveTab] = useState('my-uploads');

  // Add a state for the all books tab - now removed as we only keep one view
  const [showAllBooks, setShowAllBooks] = useState(true);

  // Create array for 8 semesters
  const semesters = Array.from({ length: 8 }, (_, i) => i + 1);

  // Add state for edit mode and book being edited
  const [editMode, setEditMode] = useState(false);
  const [bookToEdit, setBookToEdit] = useState<LibraryItem | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  
  // Add state to track which semesters are expanded
  const [expandedSemesters, setExpandedSemesters] = useState<Set<number>>(new Set());

  // Check if user is a coordinator
  const isCoordinator = user?.role === 'coordinator';

  // Function to check if the current user is the owner of a book
  const isBookOwner = (book: LibraryItem): boolean => {
    if (!user) return false;
    
    // Coordinators can edit/delete any book
    if (isCoordinator) return true;
    
    // Teachers can only edit/delete their own books
    if (typeof book.addedBy === 'string') {
      return book.addedBy === user.id;
    } else if (typeof book.addedBy === 'object' && book.addedBy) {
      // Handle case where addedBy is populated and contains the full user object
      return book.addedBy._id === user.id || book.addedBy.id === user.id;
    }
    
    return false;
  };

  // Function to toggle semester expansion
  const toggleSemesterExpansion = (semester: number) => {
    setExpandedSemesters(prevExpanded => {
      const newExpanded = new Set(prevExpanded);
      if (newExpanded.has(semester)) {
        newExpanded.delete(semester);
      } else {
        newExpanded.add(semester);
      }
      return newExpanded;
    });
  };
  
  // Function to check if a semester is expanded
  const isSemesterExpanded = (semester: number) => {
    return expandedSemesters.has(semester);
  };

  // Log authentication status when component mounts
  useEffect(() => {
    console.log('Library component mounted. Authentication status:', isAuthenticated);
    console.log('Auth token exists:', !!localStorage.getItem('token'));
    console.log('User can edit library:', canEditLibrary);
    console.log('User can view library:', canViewLibrary);
    console.log('User role:', user?.role);
    console.log('Current user ID:', user?.id);

    // For students and coordinators, expand first semester by default
    if (!isTeacher) {
      setExpandedSemesters(new Set([1]));
    } else {
      // For teachers, expand all semesters by default
      setExpandedSemesters(new Set([1, 2, 3, 4, 5, 6, 7, 8]));
    }
    
    // For all users, fetch library data appropriately
    fetchMyLibraryData(); // Always fetch my uploads first
    
    // Only fetch all books for students and coordinators
    if (!isTeacher) {
      fetchAllLibraryData();
    }
  }, [isAuthenticated, user?.id, user?.role]);

  // Fetch all library data - for students and coordinators to see all books
  // For teachers, this should only show their uploads in the "All Books" tab
  const fetchAllLibraryData = async () => {
    try {
      setLoading(true);
      console.log("Fetching all library data...");
      const data = await libraryAPI.getLibraryItems();
      console.log("All library data received:", data);
      console.log(`Received ${data.length} total books from API`);
      
      // For teachers, filter to only show their own books
      let filteredData = data;
      if (isTeacher && user?.id) {
        console.log(`Filtering library data for teacher ID: ${user.id}`);
        filteredData = data.filter(book => {
          const bookOwnerId = typeof book.addedBy === 'object' 
            ? (book.addedBy?._id || book.addedBy?.id) 
            : book.addedBy;
          
          const isOwner = bookOwnerId === user.id;
          
          if (!isOwner) {
            console.log(`Excluding book "${book.title}" because owner ID ${bookOwnerId} doesn't match current user ID ${user.id}`);
          } else {
            console.log(`Including book "${book.title}" because owner ID ${bookOwnerId} matches current user ID ${user.id}`);
          }
          
          return isOwner;
        });
        
        console.log(`After filtering: ${filteredData.length} books remain (removed ${data.length - filteredData.length})`);
      }
      
      // Log each book to debug
      filteredData.forEach((book, index) => {
        const addedByInfo = typeof book.addedBy === 'object' 
          ? `ID: ${book.addedBy?._id || book.addedBy?.id || 'Unknown'}, Name: ${book.addedBy?.name || 'Unknown'}`
          : `ID: ${book.addedBy}`;
          
        console.log(`Book ${index + 1}: "${book.title}" - Semester: ${book.semester}, Added by: ${addedByInfo}`);
      });
      
      setBooks(filteredData);
      
      // Create a map with all 8 semesters, initially empty
      const booksBySem: Record<number, LibraryItem[]> = {};
      
      // Initialize all semesters (1-8)
      for (let i = 1; i <= 8; i++) {
        booksBySem[i] = [];
      }
      
      // Populate with actual data
      if (filteredData && filteredData.length > 0) {
        filteredData.forEach((book) => {
          // Make sure semester is a number between 1-8
          let semesterNum = parseInt(String(book.semester)) || 1;
          
          // Ensure valid range
          semesterNum = Math.max(1, Math.min(8, semesterNum));
          
          // Add to appropriate semester array without modifying the original book
          booksBySem[semesterNum].push({
            ...book,
            semester: semesterNum
          });
          
          console.log(`Book "${book.title}" assigned to semester ${semesterNum}`);
        });
      } else {
        console.warn("No books received from API or data array is empty");
      }
      
      // Count books per semester
      Object.entries(booksBySem).forEach(([sem, books]) => {
        console.log(`Semester ${sem}: ${books.length} books`);
      });
      
      console.log("Final booksBySemester data:", booksBySem);
      setBooksBySemester(booksBySem);
    } catch (err) {
      console.error("Error fetching library items:", err);
      setError("Failed to load library data");
      
      // Set empty state
      setBooks([]);
      setBooksBySemester({});
    } finally {
      setLoading(false);
    }
  };

  // Fetch only the teacher's uploads
  const fetchMyLibraryData = async () => {
    try {
      setLoading(true);
      console.log("Fetching teacher's own library data...");
      const data = await libraryAPI.getMyLibraryItems();
      
      // Log teacher's books with their IDs for debugging
      console.log(`Teacher's uploaded books (total: ${data.length}):`);
      
      // Apply additional client-side filter to ensure only the teacher's books are shown
      // This is a safety check in case the backend doesn't filter correctly
      let filteredData = data;
      
      if (user?.id) {
        console.log(`Applying client-side filter for teacher ID: ${user.id}`);
        
        filteredData = data.filter(book => {
          const bookOwnerId = typeof book.addedBy === 'object' 
            ? (book.addedBy?._id || book.addedBy?.id) 
            : book.addedBy;
          
          const isOwner = bookOwnerId === user.id;
          
          if (!isOwner) {
            console.warn(`Filtering out book "${book.title}" because owner ID ${bookOwnerId} doesn't match current user ID ${user.id}`);
          }
          
          return isOwner;
        });
        
        console.log(`After client-side filtering: ${filteredData.length} books (removed ${data.length - filteredData.length})`);
      }
      
      // Log final books
      filteredData.forEach((book, index) => {
        const addedByInfo = typeof book.addedBy === 'object' 
          ? `ID: ${book.addedBy?._id || book.addedBy?.id || 'Unknown'}, Name: ${book.addedBy?.name || 'Unknown'}`
          : `ID: ${book.addedBy}`;
          
        console.log(`Book ${index + 1}: "${book.title}" - Added by: ${addedByInfo}`);
      });
      
      setMyBooks(filteredData);
    } catch (err) {
      console.error("Error fetching teacher's library items:", err);
      setError("Failed to load your uploaded books");
      
      // Set empty state
      setMyBooks([]);
    } finally {
      setLoading(false);
    }
  };

  // Get filtered books based on search term
  const getFilteredBooks = () => {
    // Use myBooks for teachers' uploads display
    return myBooks.filter(book => 
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      book.author.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Debug function to log books by semester
  const debugBooksBySemester = (semester: number) => {
    console.log(`Debug - Books in semester ${semester}:`);
    
    if (booksBySemester[semester]) {
      const semesterBooks = booksBySemester[semester];
      console.log(`Found ${semesterBooks.length} books in semester ${semester}`);
      
      semesterBooks.forEach((book, index) => {
        const addedByInfo = typeof book.addedBy === 'object' 
          ? `ID: ${book.addedBy?._id || book.addedBy?.id || 'Unknown'}, Name: ${book.addedBy?.name || 'Unknown'}`
          : `ID: ${book.addedBy}`;
          
        console.log(`Book ${index + 1}: "${book.title}" by ${book.author} - Added by: ${addedByInfo}`);
      });
      
      // Also log current user ID for comparison
      console.log(`Current user ID: ${user?.id}`);
    } else {
      console.log(`No books found in semester ${semester}`);
    }
  };

  // Get filtered books for a specific semester
  const getFilteredBooksBySemester = (semester: number) => {
    // If we have semester-organized books, use those
    if (booksBySemester[semester]) {
      return booksBySemester[semester].filter(book => 
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        book.author.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Fallback to filtering from all books
    const booksToFilter = isTeacher ? myBooks : books;
    
    return booksToFilter.filter(book => {
      const bookSemester = parseInt(String(book.semester)) || 1;
      return bookSemester === semester && (
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        book.author.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  };

  const handleDownload = (url: string) => {
    console.log('Attempting to download file from URL:', url);
    setError(null); // Clear previous errors
    
    // Check if URL is valid
    if (!url || url.trim() === ' ' || url === 'undefined') {
      console.error('Invalid download URL:', url);
      setError('This item does not have a valid download link');
      return;
    }
    
    try {
      // For uploaded files from our server
      if (url.startsWith('/uploads/')) {
        // For local files, construct the full URL with backend server address
        const fullUrl = `http://localhost:5001${url}`;
        console.log('Opening file in new tab:', fullUrl);
        
        // Create a temporary link to handle both viewing and downloading
        const link = document.createElement('a');
        link.href = fullUrl;
        link.target = '_blank'; // Open in new tab
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (url.startsWith('http://') || url.startsWith('https://')) {
        // For external links
        window.open(url, '_blank');
      } else {
        // Handle relative URLs or other formats
        console.log('Handling other URL format:', url);
        const fullUrl = url.startsWith('/') ? `http://localhost:5001${url}` : url;
        window.open(fullUrl, '_blank');
      }
    } catch (err) {
      console.error('Error during file download:', err);
      setError(`Download failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
      setSelectedFile(file);
    }
  };

  // Add function to handle initiating edit
  const handleEditBook = (book: LibraryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookToEdit(book);
    setNewBook({
      title: book.title,
      author: book.author,
      description: book.description || '',
      link: book.link || '',
      semester: book.semester || 1
    });
    setEditMode(true);
    setDialogOpen(true);
  };

  // Add function to handle delete confirmation
  const handleDeleteConfirmation = (bookId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmation(bookId);
  };

  // Add function to handle actual deletion
  const handleDeleteBook = async () => {
    if (!deleteConfirmation) return;
    
    try {
      setLoading(true);
      
      try {
        console.log('Attempting to delete book with ID:', deleteConfirmation);
        
        // First try the built-in API
        try {
          await libraryAPI.deleteLibraryItem(deleteConfirmation);
          console.log('Delete successful via API wrapper');
          
          // Update UI after successful deletion
          setBooks(books.filter(book => book._id !== deleteConfirmation));
          
          // Update booksBySemester state
          setBooksBySemester(prev => {
            const newState = { ...prev };
            Object.keys(newState).forEach(semesterKey => {
              const semester = parseInt(semesterKey);
              newState[semester] = newState[semester].filter(book => book._id !== deleteConfirmation);
            });
            return newState;
          });
          
          // Update myBooks state for teachers
          if (isTeacher) {
            setMyBooks(myBooks.filter(book => book._id !== deleteConfirmation));
          }
          
          // Show success message
          toast({
            title: "Success",
            description: "Book deleted successfully",
            variant: "default"
          });
          
          // Close the confirmation dialog
          setDeleteConfirmation(null);
          
        } catch (apiErr: any) {
          console.error('API wrapper delete failed:', apiErr);
          
          // Check if this is a permission error
          if (apiErr.permissionDenied || 
              (apiErr.message && apiErr.message.includes('Not authorized'))) {
            setError("You cannot delete books uploaded by other teachers. Only your own uploads can be deleted.");
            throw new Error("Permission denied: You can only delete your own uploads");
          }
          
          // Direct fetch approach as fallback
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:5001/api/library/${deleteConfirmation}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('Server response error:', response.status, errorData);
            
            // Special handling for permission errors
            if (response.status === 403) {
              setError("You cannot delete books uploaded by other teachers. Only your own uploads can be deleted.");
              throw new Error("Permission denied: You can only delete your own uploads");
            }
            
            // Special handling for the known server bug with remove()
            if (errorData.message && errorData.message.includes('remove is not a function')) {
              console.log('Server has Mongoose version issue with remove(). Handling client-side.');
              // Continue with UI update despite server error
              
              // Update UI after successful deletion
              setBooks(books.filter(book => book._id !== deleteConfirmation));
              
              // Update booksBySemester state
              setBooksBySemester(prev => {
                const newState = { ...prev };
                Object.keys(newState).forEach(semesterKey => {
                  const semester = parseInt(semesterKey);
                  newState[semester] = newState[semester].filter(book => book._id !== deleteConfirmation);
                });
                return newState;
              });
              
              // Update myBooks state for teachers
              if (isTeacher) {
                setMyBooks(myBooks.filter(book => book._id !== deleteConfirmation));
              }
            } else {
              throw new Error(errorData.message || `Server returned status ${response.status}`);
            }
          } else {
            console.log('Delete successful via direct fetch');
            
            // Update UI after successful deletion
            setBooks(books.filter(book => book._id !== deleteConfirmation));
            
            // Update booksBySemester state
            setBooksBySemester(prev => {
              const newState = { ...prev };
              Object.keys(newState).forEach(semesterKey => {
                const semester = parseInt(semesterKey);
                newState[semester] = newState[semester].filter(book => book._id !== deleteConfirmation);
              });
              return newState;
            });
            
            // Update myBooks state for teachers
            if (isTeacher) {
              setMyBooks(myBooks.filter(book => book._id !== deleteConfirmation));
            }
            
            // Close the confirmation dialog
            setDeleteConfirmation(null);
          }
        }
      } catch (err: any) {
        console.error('Server delete failed:', err);
        
        // Don't update UI for permission errors
        if (err.permissionDenied || 
            (err.message && err.message.includes('Permission denied'))) {
          setError("You cannot delete books uploaded by other teachers. Only your own uploads can be deleted.");
        }
        // Special case for the known server error
        else if (err instanceof Error && err.message.includes('remove is not a function')) {
          setError('Database delete partially succeeded. Changes may persist after page refresh.');
          
          // Update UI anyway since we know the specific error
          setBooks(books.filter(book => book._id !== deleteConfirmation));
          setBooksBySemester(prev => {
            const newState = { ...prev };
            Object.keys(newState).forEach(semesterKey => {
              const semester = parseInt(semesterKey);
              newState[semester] = newState[semester].filter(book => book._id !== deleteConfirmation);
            });
            return newState;
          });
          setDeleteConfirmation(null);
        } else {
          // Show clear error message but still update UI to improve user experience
          setError('Failed to delete from database. The item will reappear on page refresh.');
          
          // Still update UI (optimistic update)
          setBooks(books.filter(book => book._id !== deleteConfirmation));
          setBooksBySemester(prev => {
            const newState = { ...prev };
            Object.keys(newState).forEach(semesterKey => {
              const semester = parseInt(semesterKey);
              newState[semester] = newState[semester].filter(book => book._id !== deleteConfirmation);
            });
            return newState;
          });
          setDeleteConfirmation(null);
        }
      }
    } catch (err) {
      console.error('Error in delete flow:', err);
      setError('Failed to process the deletion. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle semester selection in the book form
  const handleSemesterChange = (semester: number) => {
    setNewBook({
      ...newBook,
      semester: semester
    });
    console.log(`Selected semester changed to: ${semester}`);
  };

  // Handle form submit (create or update)
  const handleSubmit = async () => {
    if (!newBook.title || !newBook.author) {
      setError('Title and author are required fields');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Ensure semester is a valid number
      const semester = parseInt(String(newBook.semester)) || 1;
      
      if (editMode && bookToEdit) {
        // Update existing book
        console.log(`Updating book with semester ${semester}`);
        const updatedBook = await libraryAPI.updateLibraryItem(
          bookToEdit._id,
          {
            title: newBook.title,
            author: newBook.author,
            description: newBook.description,
            link: newBook.link,
            semester: semester
          },
          selectedFile || undefined
        );
        
        // Close dialog
        setDialogOpen(false);
        
        // Show success message
        toast({
          title: "Success",
          description: "Book updated successfully",
          variant: "default"
        });
        
        // Refresh library data
        if (isTeacher) {
          fetchMyLibraryData();
        } else {
          fetchAllLibraryData();
        }
      } else {
        // Create new book
        console.log(`Creating new book with semester ${semester}`);
        const createdBook = await libraryAPI.createLibraryItem(
          {
            title: newBook.title,
            author: newBook.author,
            description: newBook.description,
            link: newBook.link,
            semester: semester
          },
          selectedFile || undefined
        );
        
        console.log('Book created successfully:', createdBook);
        
        // Close dialog
        setDialogOpen(false);
        
        // Show success message
        toast({
          title: "Success",
          description: "Book added successfully",
          variant: "default"
        });
        
        // For teachers, immediately add the new book to the myBooks array with the correct addedBy
        if (isTeacher && user?.id && createdBook) {
          console.log('Adding new book to myBooks array with current user as owner');
          
          // Ensure the addedBy field is set correctly
          const newBookWithOwner = {
            ...createdBook,
            addedBy: user.id
          };
          
          setMyBooks(prev => [newBookWithOwner, ...prev]);
        }
        
        // Refresh library data after a short delay
        setTimeout(() => {
          if (isTeacher) {
            fetchMyLibraryData();
          } else {
            fetchAllLibraryData();
          }
        }, 500);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving the book');
    } finally {
      setLoading(false);
    }
  };

  if (loading && books.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-teal-950 to-slate-900 text-white">
        <Navbar />
        
        <main className="flex-grow container mx-auto py-8 px-4 flex justify-center items-center">
          <Clock className="h-8 w-8 animate-spin mr-2 text-teal-400" />
          <p className="text-lg">Loading library data...</p>
        </main>
        
       
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-teal-950 to-slate-900 text-white">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-white">Digital Library</h1>
            <div className="flex flex-wrap items-center text-teal-300 gap-4">
              <div className="flex items-center">
                <BookOpen className="h-4 w-4 mr-1 text-teal-400" />
                <span>Browse and download educational resources</span>
              </div>
            </div>
          </div>
          
          {canEditLibrary && (
            <Button 
              onClick={() => {
                setEditMode(false);
                setNewBook({
                  title: '',
                  author: '', 
                  description: '',
                  link: '',
                  semester: 1
                });
                setSelectedFile(null);
                setDialogOpen(true);
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white shadow-md transition-all duration-200"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Book
            </Button>
          )}
        </div>
        
        {/* Search input */}
        <div className="relative mb-6">
          <Search className="absolute top-2.5 left-3 h-5 w-5 text-teal-400" />
          <Input
            type="text"
            placeholder="Search by title or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus:border-teal-500 focus:ring-teal-500"
          />
        </div>
        
        {error && (
          <div className="bg-red-900/30 border border-red-500 p-3 rounded-lg mb-6">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}
        
        {/* Interface for teachers */}
        {isTeacher && (
          <div className="w-full">
            {/* Teacher header */}
            <div className="bg-slate-800/40 border-slate-700 shadow-lg p-4 mb-6 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white">My Books by Semester</h2>
                  <p className="text-teal-300 text-sm mt-1">
                    View your uploaded books organized by semester. <span className="text-amber-400">Note: As a teacher, you can only see your own uploads.</span>
                  </p>
                </div>
                <Button 
                  onClick={fetchMyLibraryData}
                  className="bg-teal-600 hover:bg-teal-700 text-white shadow-md transition-all duration-200"
                  size="sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-8 flex justify-center items-center">
                <Clock className="h-6 w-6 animate-spin mr-2 text-teal-400" />
                <p className="text-slate-200">Loading library data...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {semesters.map((semester) => {
                  // Get books for this semester - using myBooks for teachers
                  const teacherSemBooks = myBooks.filter(book => {
                    const bookSemester = parseInt(String(book.semester)) || 1;
                    return bookSemester === semester;
                  });
                  
                  // Filter by search term
                  const semesterBooks = teacherSemBooks.filter(book => 
                    book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    book.author.toLowerCase().includes(searchTerm.toLowerCase())
                  );
                  
                  const isExpanded = isSemesterExpanded(semester);
                  
                  // Don't show semesters with no books when searching
                  if (searchTerm && semesterBooks.length === 0) {
                    return null;
                  }
                  
                  // Always show all semesters even if empty
                  return (
                    <div key={semester} className="mb-4">
                      <button 
                        onClick={() => toggleSemesterExpansion(semester)}
                        className="w-full bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 p-4 rounded-lg shadow-md border border-slate-600 flex items-center justify-between transition-all duration-200"
                      >
                        <div className="flex items-center">
                          {isExpanded ? (
                            <FolderOpen className="h-6 w-6 text-teal-400 mr-3" />
                          ) : (
                            <Folder className="h-6 w-6 text-teal-400 mr-3" />
                          )}
                          <div className="text-left">
                            <h2 className="text-xl font-bold text-white">Semester {semester}</h2>
                            <p className="text-teal-300 text-sm">{semesterBooks.length} resource{semesterBooks.length !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-teal-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-teal-400" />
                        )}
                      </button>
                      
                      {/* Collapsible content */}
                      <div 
                        className={`overflow-hidden transition-all duration-300 ${
                          isExpanded 
                            ? 'max-h-[2000px] opacity-100 mt-4' 
                            : 'max-h-0 opacity-0'
                        }`}
                      >
                        {isExpanded && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
                            {semesterBooks.length > 0 ? (
                              semesterBooks.map((book) => (
                                <Card key={book._id} className="bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600 hover:border-teal-600 transition-all duration-300 shadow-lg">
                                  <CardHeader className="pb-2 border-b border-slate-600 bg-slate-800/50 flex flex-row justify-between items-start">
                                    <CardTitle className="text-lg text-teal-200">{book.title}</CardTitle>
                                    {canEditLibrary && (isBookOwner(book) || isCoordinator) && (
                                      <div className="flex space-x-1">
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          onClick={(e) => handleEditBook(book, e)}
                                          className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-700"
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="icon"
                                          onClick={(e) => handleDeleteConfirmation(book._id, e)}
                                          className="h-8 w-8 text-slate-300 hover:text-red-400 hover:bg-slate-700"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    )}
                                  </CardHeader>
                                  <CardContent className="pt-4">
                                    <p className="text-slate-200 mb-4">{book.description || "No description available"}</p>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                      <Button 
                                        className="flex-grow bg-teal-600 hover:bg-teal-700 text-white shadow-md transition-all duration-200"
                                        onClick={() => handleDownload(book.link)}
                                      >
                                        <BookOpen className="mr-2 h-4 w-4" />
                                        View Book
                                      </Button>
                                      <Button 
                                        className="flex-grow bg-teal-600 hover:bg-teal-700 text-white shadow-md transition-all duration-200"
                                        onClick={() => handleDownload(book.link)}
                                      >
                                        <Download className="mr-2 h-4 w-4" />
                                        Download
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))
                            ) : (
                              <div className="col-span-2 text-center py-8 bg-slate-800/50 rounded-lg border border-slate-600 p-4">
                                <BookOpen className="h-8 w-8 text-teal-400 mx-auto mb-2" />
                                <p className="text-teal-300">No books found for Semester {semester}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {/* Show a message if no books were found at all */}
                {myBooks.length === 0 && (
                  <div className="text-center py-16 bg-slate-800/50 rounded-xl border border-slate-600 mt-4">
                    <BookOpen className="h-16 w-16 mx-auto mb-4 text-teal-400" />
                    <h3 className="text-xl font-medium text-slate-200 mb-2">No books uploaded yet</h3>
                    <p className="text-teal-300 mb-6 max-w-md mx-auto">You haven't uploaded any books to the library yet.</p>
                    {canEditLibrary && (
                      <Button 
                        onClick={() => {
                          setEditMode(false);
                          setNewBook({
                            title: '',
                            author: '', 
                            description: '',
                            link: '',
                            semester: 1
                          });
                          setSelectedFile(null);
                          setDialogOpen(true);
                        }}
                        className="bg-teal-600 hover:bg-teal-700 text-white shadow-md transition-all duration-200"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Book
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Interface for non-teachers (students, coordinators) */}
        {!isTeacher && (
          <>
            {loading ? (
              <div className="text-center py-8 flex justify-center items-center">
                <Clock className="h-6 w-6 animate-spin mr-2 text-teal-400" />
                <p className="text-slate-200">Loading library data...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {semesters.map((semester) => {
                  // Get books for this semester
                  const semesterBooks = getFilteredBooksBySemester(semester);
                  const isExpanded = isSemesterExpanded(semester);
                  
                  // Don't show semesters with no books when searching
                  if (searchTerm && semesterBooks.length === 0) {
                    return null;
                  }
                  
                  return (
                    <div key={semester} className="mb-4">
                      <button 
                        onClick={() => toggleSemesterExpansion(semester)}
                        className="w-full bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 p-4 rounded-lg shadow-md border border-slate-600 flex items-center justify-between transition-all duration-200"
                      >
                        <div className="flex items-center">
                          {isExpanded ? (
                            <FolderOpen className="h-6 w-6 text-teal-400 mr-3" />
                          ) : (
                            <Folder className="h-6 w-6 text-teal-400 mr-3" />
                          )}
                          <div className="text-left">
                            <h2 className="text-xl font-bold text-white">Semester {semester}</h2>
                            <p className="text-teal-300 text-sm">{semesterBooks.length} resource{semesterBooks.length !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-teal-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-teal-400" />
                        )}
                      </button>
                      
                      {/* Collapsible content */}
                      <div 
                        className={`overflow-hidden transition-all duration-300 ${
                          isExpanded 
                            ? 'max-h-[2000px] opacity-100 mt-4' 
                            : 'max-h-0 opacity-0'
                        }`}
                      >
                        {isExpanded && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
                            {semesterBooks.length > 0 ? (
                              semesterBooks.map((book) => (
                                <Card key={book._id} className="bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600 hover:border-teal-600 transition-all duration-300 shadow-lg">
                                  <CardHeader className="pb-2 border-b border-slate-600 bg-slate-800/50 flex flex-row justify-between items-start">
                                    <CardTitle className="text-lg text-teal-200">{book.title}</CardTitle>
                                    {canEditLibrary && (isBookOwner(book) || isCoordinator) && (
                                      <div className="flex space-x-1">
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          onClick={(e) => handleEditBook(book, e)}
                                          className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-700"
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="icon"
                                          onClick={(e) => handleDeleteConfirmation(book._id, e)}
                                          className="h-8 w-8 text-slate-300 hover:text-red-400 hover:bg-slate-700"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    )}
                                  </CardHeader>
                                  <CardContent className="pt-4">
                                    <p className="text-slate-200 mb-4">{book.description || "No description available"}</p>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                      <Button 
                                        className="flex-grow bg-teal-600 hover:bg-teal-700 text-white shadow-md transition-all duration-200"
                                        onClick={() => handleDownload(book.link)}
                                      >
                                        <BookOpen className="mr-2 h-4 w-4" />
                                        View Book
                                      </Button>
                                      <Button 
                                        className="flex-grow bg-teal-600 hover:bg-teal-700 text-white shadow-md transition-all duration-200"
                                        onClick={() => handleDownload(book.link)}
                                      >
                                        <Download className="mr-2 h-4 w-4" />
                                        Download
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))
                            ) : (
                              <div className="col-span-2 text-center py-8 bg-slate-800/50 rounded-lg border border-slate-600 p-4">
                                <BookOpen className="h-8 w-8 text-teal-400 mx-auto mb-2" />
                                <p className="text-teal-300">No books found for Semester {semester}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* Delete confirmation dialog */}
      {deleteConfirmation && (
        <Dialog open={!!deleteConfirmation} onOpenChange={(open) => !open && setDeleteConfirmation(null)}>
          <DialogContent className="bg-slate-900 text-white border-slate-700 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-white">Confirm Deletion</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-teal-100 mb-4">Are you sure you want to delete this book? This action cannot be undone.</p>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setDeleteConfirmation(null)}
                  className="bg-transparent border-slate-600 text-teal-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleDeleteBook}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white shadow-md transition-all duration-200"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Details dialog */}
      {selectedBook && (
        <Dialog open={!!selectedBook} onOpenChange={(open) => !open && setSelectedBook(null)}>
          <DialogContent className="bg-[#2A2A2A] text-white border-[#444444] max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl">{selectedBook.title}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="flex items-center space-x-2 mb-4">
                <BookOpen className="h-5 w-5 text-purple-400" />
                <p className="text-gray-300 font-medium">{selectedBook.author}</p>
              </div>
              
              <p className="text-gray-300 mb-6">{selectedBook.description}</p>
              
              {selectedBook.link && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={() => handleDownload(selectedBook.link)}
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    View Book
                  </Button>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      try {
                        const fileName = selectedBook.link.split('/').pop() || 'book.pdf';
                        
                        // Handle uploaded files vs external links differently
                        if (selectedBook.link.startsWith('/uploads/')) {
                          // For server files, construct full URL
                          const baseUrl = 'http://localhost:5001';
                          const fullUrl = `${baseUrl}${selectedBook.link}`;
                          
                          // Open in new tab
                          window.open(fullUrl, '_blank');
                        } else {
                          // For external links, use download attribute
                          const link = document.createElement('a');
                          link.href = selectedBook.link;
                          link.download = fileName;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }
                      } catch (err) {
                        console.error('Error handling download:', err);
                        // Fallback to basic download
                        handleDownload(selectedBook.link);
                      }
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog for adding/editing books */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 text-white border-slate-700 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">{editMode ? 'Edit Book' : 'Add New Book'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-teal-300">Title*</Label>
              <Input 
                id="title" 
                placeholder="Book Title" 
                value={newBook.title}
                onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus:border-teal-500 focus:ring-teal-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author" className="text-teal-300">Author*</Label>
              <Input 
                id="author" 
                placeholder="Book Author" 
                value={newBook.author}
                onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus:border-teal-500 focus:ring-teal-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="semester" className="text-teal-300">Semester*</Label>
              <select
                id="semester"
                value={newBook.semester}
                onChange={(e) => handleSemesterChange(parseInt(e.target.value))}
                className="w-full bg-slate-800 border-slate-700 rounded p-2 text-white focus:border-teal-500 focus:ring-teal-500"
              >
                {semesters.map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-teal-300">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Book Description" 
                value={newBook.description}
                onChange={(e) => setNewBook({...newBook, description: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus:border-teal-500 focus:ring-teal-500 min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link" className="text-teal-300">External Link</Label>
              <Input 
                id="link" 
                placeholder="https://example.com/file.pdf" 
                value={newBook.link}
                onChange={(e) => setNewBook({...newBook, link: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus:border-teal-500 focus:ring-teal-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="file" className="text-teal-300">{editMode ? 'Replace File (optional)' : 'Upload File*'}</Label>
              <Input 
                id="file" 
                type="file" 
                onChange={handleFileChange}
                className="bg-slate-800 border-slate-700 text-white file:bg-teal-600 file:text-white file:border-0 file:rounded-md file:px-4 file:py-2 file:mr-4 file:hover:bg-teal-700 file:transition-colors"
              />
              {selectedFile && (
                <p className="text-sm text-teal-400">
                  File selected: {selectedFile.name}
                </p>
              )}
              {editMode && !selectedFile && (
                <p className="text-sm text-amber-400">
                  No new file selected. The existing file will be kept.
                </p>
              )}
            </div>
            {error && (
              <p className="text-red-400 text-sm bg-red-900/30 p-2 rounded-md">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button 
              onClick={handleSubmit}
              disabled={loading}
              className="bg-teal-600 hover:bg-teal-700 text-white shadow-md transition-all duration-200"
            >
              {loading ? 'Saving...' : editMode ? 'Update Book' : 'Add Book'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Library;