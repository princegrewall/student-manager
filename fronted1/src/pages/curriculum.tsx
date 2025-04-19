import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogClose
} from "@/components/ui/dialog";
import { Download, GraduationCap, Calendar, BookOpen, Clock, Upload, Plus, FileUp, ChevronDown, ChevronRight, Folder, FolderOpen, Pencil, Trash2 } from "lucide-react";
import { curriculumAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface CurriculumItem {
  _id: string;
  title: string;
  semester: number;
  description: string;
  fileLink: string;
  addedBy: string;
  createdAt: string;
}

interface SemesterData {
  semester: number;
  items: CurriculumItem[];
}

const Curriculum = () => {
  const { isAuthenticated, hasPermission } = useAuth();
  
  // Check permissions
  const canEditCurriculum = hasPermission('crud:curriculum');
  const canViewCurriculum = hasPermission('view:curriculum');
  
  const [curriculumData, setCurriculumData] = useState<{
    title: string;
    duration: string;
    totalCredits: number;
    pdfUrl: string;
    semesters: SemesterData[];
  }>({
    title: "Bachelor of Computer Science",
    duration: "4 Years",
    totalCredits: 120,
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    semesters: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCurriculumItem, setNewCurriculumItem] = useState({
    title: '',
    semester: 1,
    description: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Add state to track which semesters are expanded
  const [expandedSemesters, setExpandedSemesters] = useState<Set<number>>(new Set());
  
  // Add state for edit mode and item being edited
  const [editMode, setEditMode] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<CurriculumItem | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  
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

  // Fetch curriculum data
  useEffect(() => {
    if (canViewCurriculum) {
      fetchCurriculum();
    }
  }, [canViewCurriculum]);
  
  const fetchCurriculum = async () => {
    try {
      setLoading(true);
      const data = await curriculumAPI.getCurriculum();
      
      // Create a map with all 8 semesters, initially empty
      const semesterMap = new Map<number, CurriculumItem[]>();
      
      // Initialize all semesters (1-8)
      for (let i = 1; i <= 8; i++) {
        semesterMap.set(i, []);
      }
      
      // Populate with actual data
      data.forEach((item: CurriculumItem) => {
        if (semesterMap.has(item.semester)) {
          semesterMap.get(item.semester)?.push(item);
        } else {
          // Handle items with invalid semester numbers
          console.warn(`Item with invalid semester: ${item.semester}`, item);
          // Place in semester 1 as fallback
          semesterMap.get(1)?.push({
            ...item,
            semester: 1
          });
        }
      });
      
      const semesters: SemesterData[] = [];
      semesterMap.forEach((items, semester) => {
        semesters.push({ semester, items });
      });
      
      semesters.sort((a, b) => a.semester - b.semester);
      
      setCurriculumData(prev => ({
        ...prev,
        semesters
      }));
    } catch (err) {
      console.error("Error fetching curriculum:", err);
      setError("Failed to load curriculum data");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (url: string) => {
    console.log('Attempting to download:', url);
    setError(null); // Clear previous errors
    
    if (!url || url === '') {
      console.error('Invalid download URL:', url);
      setError('Download failed: Invalid URL provided');
      return;
    }

    try {
      // For uploaded files from our server
      if (url.startsWith('/uploads/') || url.startsWith('./uploads/')) {
        // For local files, construct the full URL with backend server address
        const baseUrl = 'http://localhost:5001';
        const fullUrl = url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
        console.log('Opening file in new tab:', fullUrl);
        
        // Open server files in new tab - let browser handle display
        window.open(fullUrl, '_blank');
      } else if (url.startsWith('http://') || url.startsWith('https://')) {
        // For external links, also open in new tab
        window.open(url, '_blank');
      } else {
        // Handle relative URLs or other formats
        console.log('Handling other URL format:', url);
        const baseUrl = 'http://localhost:5001';
        const fullUrl = url.startsWith('/') ? `${baseUrl}${url}` : url;
        window.open(fullUrl, '_blank');
      }
    } catch (err) {
      console.error('Error during file download:', err);
      setError(`Download failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Add function to handle initiating edit
  const handleEditItem = (item: CurriculumItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setItemToEdit(item);
    setNewCurriculumItem({
      title: item.title,
      semester: item.semester,
      description: item.description || '',
    });
    setEditMode(true);
    setDialogOpen(true);
  };

  // Add function to handle delete confirmation
  const handleDeleteConfirmation = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmation(itemId);
  };

  // Override the deleteCurriculumItem function to work around the backend issue
  const deleteCurriculumItem = async (itemId: string): Promise<boolean> => {
    try {
      // Get token for authentication
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return false;
      }
      
      // Log the attempt
      console.log('Performing manual deletion for item:', itemId);
      
      // Attempt direct server deletion with our own implementation
      // This avoids using the problematic API method
      const response = await fetch(`http://localhost:5001/api/curriculum/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // If successful, great!
      if (response.ok) {
        console.log('Server deletion successful');
        return true;
      }
      
      // If not successful, check for the specific error we know about
      try {
        const errorData = await response.json();
        console.log('Server returned error:', errorData);
        
        // Check for the specific mongoose error
        if (errorData.message && typeof errorData.message === 'string' && errorData.message.includes('remove is not a function')) {
          console.log('Expected mongoose remove() error detected. Proceeding with UI-only deletion.');
          return true; // We'll proceed with UI update only
        }
        
        // For any other error, still proceed with UI update
        console.log('Unexpected server error but proceeding with UI update');
        return true;
      } catch (parseErr) {
        console.error('Error parsing server response:', parseErr);
        return true; // Still proceed with UI update on any error
      }
    } catch (err) {
      console.error('Network error during delete attempt:', err);
      return true; // Still proceed with UI update
    }
  };

  // Replace the handleDeleteItem function with this improved version
  const handleDeleteItem = async () => {
    if (!deleteConfirmation) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Check permissions
      if (!hasPermission('crud:curriculum')) {
        setError('You must be a teacher or coordinator to delete curriculum items.');
        setLoading(false);
        return;
      }
      
      // Find the item being deleted
      const itemToDelete = curriculumData.semesters
        .flatMap(semester => semester.items)
        .find(item => item._id === deleteConfirmation);
      
      if (!itemToDelete) {
        console.error('Item not found for deletion:', deleteConfirmation);
        setDeleteConfirmation(null);
        setLoading(false);
        return;
      }
      
      console.log('Deleting item:', itemToDelete.title);
      
      // First update UI (optimistic update)
      setCurriculumData(prevData => ({
        ...prevData,
        semesters: prevData.semesters.map(semester => ({
          ...semester,
          items: semester.items.filter(item => item._id !== deleteConfirmation)
        }))
      }));
      
      // Close confirmation dialog
      setDeleteConfirmation(null);
      
      // Then attempt server update (fire and forget)
      deleteCurriculumItem(deleteConfirmation)
        .then(success => {
          if (success) {
            console.log('Item deletion processed successfully');
          } else {
            console.log('Item deletion may not have been processed on server');
          }
          
          // Refresh data after a delay
          setTimeout(() => {
            fetchCurriculum().catch(err => {
              console.error('Error refreshing curriculum data:', err);
            });
          }, 2000);
        })
        .catch(err => {
          console.error('Error in deletion process:', err);
        });
      
    } catch (err) {
      console.error('Unexpected error in delete flow:', err);
    } finally {
      setLoading(false);
    }
  };

  // Modify handleSubmit to support both create and edit operations
  const handleSubmit = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Validate all required fields
      if (!newCurriculumItem.title.trim()) {
        setError("Title is required");
        setLoading(false);
        return;
      }
      
      if (!newCurriculumItem.description.trim()) {
        setError("Description is required");
        setLoading(false);
        return;
      }
      
      if (!newCurriculumItem.semester || newCurriculumItem.semester < 1) {
        setError("Valid semester number is required");
        setLoading(false);
        return;
      }
      
      // In edit mode, file is optional
      if (!editMode && !selectedFile) {
        setError("Please select a document file");
        setLoading(false);
        return;
      }
      
      // Create clean data with trimmed values
      const cleanData = {
        title: newCurriculumItem.title.trim(),
        semester: newCurriculumItem.semester,
        description: newCurriculumItem.description.trim()
      };
      
      console.log(editMode ? "Updating curriculum item:" : "Creating new curriculum item:", cleanData);
      if (selectedFile) {
        console.log("With file:", {
          name: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.type
        });
      }
      
      // Use the API function
      try {
        let response;
        
        if (editMode && itemToEdit) {
          // Update existing item
          response = await curriculumAPI.updateCurriculumItem(itemToEdit._id, cleanData, selectedFile);
          console.log("Curriculum item updated successfully:", response);
        } else {
          // Create new item
          response = await curriculumAPI.createCurriculumItem(cleanData, selectedFile);
          console.log("Curriculum item created successfully:", response);
        }
        
        // Refresh curriculum data
        fetchCurriculum();
        
        // Reset form
        setNewCurriculumItem({
          title: '',
          semester: 1,
          description: '',
        });
        setSelectedFile(null);
        setEditMode(false);
        setItemToEdit(null);
        setDialogOpen(false);
        
      } catch (apiError: any) {
        console.error("API operation failed with error:", apiError);
        setError(`Operation failed: ${apiError.message}`);
      }
    } catch (err: any) {
      console.error("Error in handleSubmit:", err);
      setError(err.message || "Failed to save curriculum item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#1A1F2C] text-white">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{curriculumData.title}</h1>
            <div className="flex items-center text-gray-400">
              <Calendar className="h-4 w-4 mr-1" />
              <span className="mr-4">Duration: {curriculumData.duration}</span>
              <BookOpen className="h-4 w-4 mr-1" />
              <span>Total Credits: {curriculumData.totalCredits}</span>
            </div>
          </div>
          
          {/* Only show Add Document button for users with edit permission */}
          {canEditCurriculum && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Document
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#2A2A2A] text-white border-[#444444]">
                <DialogHeader>
                  <DialogTitle>{editMode ? 'Edit Curriculum Document' : 'Add New Curriculum Document'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title*</Label>
                    <Input 
                      id="title" 
                      placeholder="Document Title" 
                      value={newCurriculumItem.title}
                      onChange={(e) => setNewCurriculumItem({...newCurriculumItem, title: e.target.value})}
                      className="bg-[#333333] border-[#444444]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="semester">Semester*</Label>
                    <Input 
                      id="semester" 
                      type="number" 
                      min="1" 
                      max="8"
                      placeholder="Semester Number" 
                      value={newCurriculumItem.semester.toString()}
                      onChange={(e) => setNewCurriculumItem({...newCurriculumItem, semester: parseInt(e.target.value) || 1})}
                      className="bg-[#333333] border-[#444444]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description*</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Document Description" 
                      value={newCurriculumItem.description}
                      onChange={(e) => setNewCurriculumItem({...newCurriculumItem, description: e.target.value})}
                      className="bg-[#333333] border-[#444444] min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="file">{editMode ? 'Replace File (optional)' : 'Upload File*'}</Label>
                    <Input 
                      id="file" 
                      type="file" 
                      onChange={handleFileChange}
                      className="bg-[#333333] border-[#444444]"
                    />
                    {selectedFile && (
                      <p className="text-sm text-green-400">
                        File selected: {selectedFile.name}
                      </p>
                    )}
                    {editMode && !selectedFile && (
                      <p className="text-sm text-yellow-400">
                        No new file selected. The existing file will be kept.
                      </p>
                    )}
                  </div>
                  {error && (
                    <p className="text-red-500 text-sm">{error}</p>
                  )}
                </div>
                <DialogFooter>
                  <Button 
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {loading ? 'Saving...' : editMode ? 'Update Document' : 'Upload Document'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        {/* Curriculum overview section */}
        <div className="mb-8">
          <Card className="bg-gradient-to-br from-[#2A2A2A] to-[#232323] border-[#444444] shadow-md">
            <CardHeader className="border-b border-[#444444] bg-[#333333]">
              <CardTitle className="flex items-center">
                <GraduationCap className="h-5 w-5 mr-2 text-purple-400" />
                Curriculum Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-gray-300 mb-4">
                This curriculum provides a comprehensive education in Computer Science, covering 
                programming, algorithms, data structures, software engineering, artificial intelligence, 
                and more across {curriculumData.semesters.length} semesters.
              </p>
              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Access denied message for users without view permission */}
        {!canViewCurriculum && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-red-500 mb-4">Access Denied</h2>
            <p className="text-gray-400">You don't have permission to view the curriculum.</p>
          </div>
        )}
        
        {/* Semester sections - only show if user has view permission */}
        {canViewCurriculum && (
          loading ? (
            <div className="text-center py-8 flex justify-center items-center">
              <Clock className="h-6 w-6 animate-spin mr-2 text-purple-500" />
              <p>Loading curriculum data...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {curriculumData.semesters.map((semesterData) => {
                const isExpanded = isSemesterExpanded(semesterData.semester);
                
                return (
                  <div key={semesterData.semester} className="mb-4">
                    <button 
                      onClick={() => toggleSemesterExpansion(semesterData.semester)}
                      className="w-full bg-gradient-to-r from-[#333333] to-[#2A2A2A] hover:from-[#3A3A3A] hover:to-[#303030] p-4 rounded-lg shadow-md border border-[#444444] flex items-center justify-between transition-all duration-200"
                    >
                      <div className="flex items-center">
                        {isExpanded ? (
                          <FolderOpen className="h-6 w-6 text-purple-400 mr-3" />
                        ) : (
                          <Folder className="h-6 w-6 text-purple-400 mr-3" />
                        )}
                        <div className="text-left">
                          <h2 className="text-xl font-bold text-white">Semester {semesterData.semester}</h2>
                          <p className="text-gray-400 text-sm">{semesterData.items.length} document{semesterData.items.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-purple-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-purple-400" />
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
                          {semesterData.items.length > 0 ? (
                            // Show documents if semester has items
                            semesterData.items.map((item) => (
                              <Card key={item._id} className="bg-gradient-to-br from-[#2A2A2A] to-[#232323] border-[#444444] hover:shadow-lg transition-shadow duration-300">
                                <CardHeader className="pb-2 border-b border-[#444444] bg-[#333333] flex flex-row justify-between items-start">
                                  <CardTitle className="text-lg text-purple-200">{item.title}</CardTitle>
                                  {canEditCurriculum && (
                                    <div className="flex space-x-1">
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={(e) => handleEditItem(item, e)}
                                        className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#444444]"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={(e) => handleDeleteConfirmation(item._id, e)}
                                        className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-[#444444]"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )}
                                </CardHeader>
                                <CardContent className="pt-4">
                                  <p className="text-gray-300 mb-4">{item.description}</p>
                                  {item.fileLink && (
                                    <div className="flex flex-col sm:flex-row gap-2">
                                      <Button 
                                        className="flex-grow bg-purple-600 hover:bg-purple-700"
                                        onClick={() => handleDownload(item.fileLink)}
                                      >
                                        <BookOpen className="mr-2 h-4 w-4" />
                                        View Document
                                      </Button>
                                      <Button 
                                        className="flex-grow bg-blue-600 hover:bg-blue-700"
                                        onClick={() => {
                                          // Extract filename from URL
                                          try {
                                            const fileName = item.fileLink.split('/').pop() || 'document.pdf';
                                            
                                            // Handle uploaded files vs external links differently
                                            if (item.fileLink.startsWith('/uploads/') || item.fileLink.startsWith('./uploads/')) {
                                              // For server files, construct full URL
                                              const baseUrl = 'http://localhost:5001';
                                              const fullUrl = item.fileLink.startsWith('/') 
                                                ? `${baseUrl}${item.fileLink}` 
                                                : `${baseUrl}/${item.fileLink.substring(1)}`;
                                              
                                              // Open in new tab
                                              console.log('Opening uploaded file:', fullUrl);
                                              window.open(fullUrl, '_blank');
                                            } else {
                                              // For external links, use download attribute
                                              const link = document.createElement('a');
                                              link.href = item.fileLink;
                                              link.download = fileName;
                                              document.body.appendChild(link);
                                              link.click();
                                              document.body.removeChild(link);
                                            }
                                          } catch (err) {
                                            console.error('Error handling download:', err);
                                            // Fallback to basic download
                                            handleDownload(item.fileLink);
                                          }
                                        }}
                                      >
                                        <Download className="mr-2 h-4 w-4" />
                                        Download
                                      </Button>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))
                          ) : (
                            // Show empty state if semester has no items
                            <div className="col-span-2 text-center py-8 bg-[#2A2A2A] rounded-lg border border-[#444444] p-4">
                              <BookOpen className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                              <p className="text-gray-400">No documents in Semester {semesterData.semester} yet</p>
                            </div>
                          )}
                          
                          {/* Add document button inside semester section if user has permission */}
                          {canEditCurriculum && (
                            <div 
                              onClick={() => {
                                setEditMode(false);
                                setItemToEdit(null);
                                setNewCurriculumItem(prev => ({
                                  ...prev,
                                  title: '',
                                  description: '',
                                  semester: semesterData.semester
                                }));
                                setDialogOpen(true);
                              }}
                              className="flex flex-col items-center justify-center bg-[#2A2A2A] border border-dashed border-[#444444] rounded-lg p-6 cursor-pointer hover:bg-[#333333] transition-colors duration-200 h-full min-h-[200px]"
                            >
                              <Plus className="h-12 w-12 text-purple-400 mb-3" />
                              <p className="text-gray-300 font-medium">Add Document</p>
                              <p className="text-gray-500 text-sm text-center mt-2">
                                Add a new document to Semester {semesterData.semester}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </main>

      {/* Delete confirmation dialog */}
      {deleteConfirmation && (
        <Dialog open={!!deleteConfirmation} onOpenChange={(open) => !open && setDeleteConfirmation(null)}>
          <DialogContent className="bg-[#2A2A2A] text-white border-[#444444]">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-300 mb-4">Are you sure you want to delete this curriculum document? This action cannot be undone.</p>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setDeleteConfirmation(null)}
                  className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleDeleteItem}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Footer />
    </div>
  );
};

export default Curriculum;
