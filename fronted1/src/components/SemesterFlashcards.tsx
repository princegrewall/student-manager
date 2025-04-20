import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  BookOpen, 
  FileText, 
  Edit, 
  Trash2, 
  Download, 
  Plus, 
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { useAuth } from '@/lib/auth-context';
import { curriculumAPI, libraryAPI } from '@/lib/api';

interface CurriculumItem {
  _id: string;
  title: string;
  semester: number;
  description: string;
  fileLink: string;
  addedBy: string;
  createdAt: string;
}

interface LibraryItem {
  _id: string;
  title: string;
  author: string;
  link: string;
  description: string;
  semester?: number;
  addedBy: string;
  createdAt: string;
  coverImage?: string;
}

interface SemesterFlashcardsProps {
  refreshData?: () => void;
}

const SemesterFlashcards: React.FC<SemesterFlashcardsProps> = ({ refreshData }) => {
  const { hasPermission } = useAuth();
  const canEditCurriculum = hasPermission('crud:curriculum');
  const canEditLibrary = hasPermission('crud:library');
  
  const [curriculumItems, setCurriculumItems] = useState<Record<number, CurriculumItem[]>>({});
  const [libraryItems, setLibraryItems] = useState<Record<number, LibraryItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDeleteDialog, setActiveDeleteDialog] = useState<{type: 'curriculum' | 'library', id: string} | null>(null);

  // Create array for 8 semesters
  const semesters = Array.from({ length: 8 }, (_, i) => i + 1);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch curriculum data
      const curriculumData = await curriculumAPI.getCurriculum();
      
      // Group curriculum by semester
      const curriculumBySemester: Record<number, CurriculumItem[]> = {};
      curriculumData.forEach((item: CurriculumItem) => {
        if (!curriculumBySemester[item.semester]) {
          curriculumBySemester[item.semester] = [];
        }
        curriculumBySemester[item.semester].push(item);
      });
      setCurriculumItems(curriculumBySemester);
      
      // Fetch library data
      const libraryData = await libraryAPI.getLibraryItems();
      
      // For this example, simulate assigning library items to semesters
      // In a real implementation, you'd have the semester field in your library data
      const libraryBySemester: Record<number, LibraryItem[]> = {};
      libraryData.forEach((item: LibraryItem, index: number) => {
        // Assign each item to a semester between 1-8 based on index for demo purposes
        const assignedSemester = (index % 8) + 1;
        if (!libraryBySemester[assignedSemester]) {
          libraryBySemester[assignedSemester] = [];
        }
        libraryBySemester[assignedSemester].push({
          ...item,
          semester: assignedSemester
        });
      });
      setLibraryItems(libraryBySemester);
      
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type: 'curriculum' | 'library', id: string) => {
    try {
      if (type === 'curriculum') {
        await curriculumAPI.deleteCurriculumItem(id);
      } else {
        await libraryAPI.deleteLibraryItem(id);
      }
      
      // Refresh data after deletion
      fetchData();
      
      // Reset active dialog
      setActiveDeleteDialog(null);
    } catch (err) {
      console.error(`Error deleting ${type} item:`, err);
      setError(`Failed to delete ${type} item. Please try again.`);
    }
  };

  const handleDownload = (url: string) => {
    if (!url || url === '') {
      setError('Download failed: Invalid URL provided');
      return;
    }

    try {
      const link = document.createElement('a');
      const fileName = url.split('/').pop() || 'document.pdf';
      
      if (url.startsWith('/uploads') || url.startsWith('./uploads')) {
        const baseUrl = 'http://localhost:5001';
        const fullUrl = url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
        link.href = fullUrl;
      } else {
        link.href = url;
      }
      
      link.setAttribute('download', fileName);
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error during file download:', err);
      setError(`Download failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
        <p className="ml-3 text-lg text-gray-500">Loading data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {semesters.map((semester) => (
          <Card key={semester} className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-t-4 border-t-teal-500 overflow-hidden bg-slate-900">
            <CardHeader className="bg-gradient-to-br from-teal-950 to-slate-900 text-white">
              <CardTitle className="text-xl font-bold">Semester {semester}</CardTitle>
              <CardDescription className="text-white/90 font-medium">Academic resources</CardDescription>
            </CardHeader>
            
            <CardContent className="p-4 bg-slate-800/40">
              <Tabs defaultValue="curriculum" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-800/40">
                  <TabsTrigger value="curriculum" className="text-sm font-medium data-[state=active]:bg-teal-900 data-[state=active]:text-teal-100">
                    <FileText className="h-4 w-4 mr-2" />
                    Curriculum
                  </TabsTrigger>
                  <TabsTrigger value="library" className="text-sm font-medium data-[state=active]:bg-teal-900 data-[state=active]:text-teal-100">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Library
                  </TabsTrigger>
                </TabsList>
                
                {/* Curriculum Tab */}
                <TabsContent value="curriculum" className="mt-0">
                  <div className="space-y-3 max-h-64 overflow-auto pr-1">
                    {curriculumItems[semester]?.length > 0 ? (
                      curriculumItems[semester].map((item) => (
                        <div 
                          key={item._id} 
                          className="p-3 bg-slate-800 rounded-lg border border-slate-700 transition-colors duration-200"
                        >
                          <h4 className="font-semibold text-slate-300 truncate">{item.title}</h4>
                          <p className="text-sm text-slate-300 mt-1 line-clamp-2">{item.description}</p>
                          
                          <div className="flex justify-between items-center mt-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDownload(item.fileLink)}
                              className="text-teal-400 hover:text-teal-300 hover:bg-teal-900/50 p-0 h-8"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              <span className="text-xs">Download</span>
                            </Button>
                            
                            {canEditCurriculum && (
                              <div className="flex space-x-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-slate-400 hover:text-teal-400 hover:bg-teal-900/50"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-900/50"
                                  onClick={() => setActiveDeleteDialog({type: 'curriculum', id: item._id})}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-300 rounded-lg border border-slate-700 bg-slate-800">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p>No curriculum materials added</p>
                        {canEditCurriculum && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2 text-xs border-teal-500 text-teal-800 hover:bg-teal-900/50"
                            onClick={() => console.log(`Add curriculum for semester ${semester}`)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Material
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                {/* Library Tab */}
                <TabsContent value="library" className="mt-0">
                  <div className="space-y-3 max-h-64 overflow-auto pr-1">
                    {libraryItems[semester]?.length > 0 ? (
                      libraryItems[semester].map((item) => (
                        <div 
                          key={item._id} 
                          className="p-3 bg-slate-800 rounded-lg border border-slate-700 hover:bg-slate-700/50 transition-colors duration-200"
                        >
                          <h4 className="font-semibold text-slate-300 truncate">{item.title}</h4>
                          <p className="text-xs text-teal-400 mb-1">by {item.author}</p>
                          <p className="text-sm text-slate-300 mt-1 line-clamp-2">{item.description}</p>
                          
                          <div className="flex justify-between items-center mt-2">
                            {item.link && item.link !== ' ' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDownload(item.link)}
                                className="text-teal-400 hover:text-teal-300 hover:bg-teal-900/50 p-0 h-8"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                <span className="text-xs">Download</span>
                              </Button>
                            )}
                            
                            {canEditLibrary && (
                              <div className="flex space-x-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-slate-400 hover:text-teal-400 hover:bg-teal-900/50"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-900/50"
                                  onClick={() => setActiveDeleteDialog({type: 'library', id: item._id})}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-300 bg-slate-800 rounded-lg border border-slate-700">
                        <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p>No library resources added</p>
                        {canEditLibrary && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2 text-xs border-teal-500 text-teal-800 hover:bg-teal-900/50"
                            onClick={() => console.log(`Add library resource for semester ${semester}`)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Resource
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Confirmation Dialog for Delete */}
      {activeDeleteDialog && (
        <Dialog open={!!activeDeleteDialog} onOpenChange={() => setActiveDeleteDialog(null)}>
          <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-100">Confirm Deletion</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-slate-300">Are you sure you want to delete this {activeDeleteDialog.type} item? This action cannot be undone.</p>
            </div>
            <DialogFooter className="flex space-x-2 justify-end">
              <Button variant="outline" onClick={() => setActiveDeleteDialog(null)} className="border-slate-600 text-slate-300 hover:bg-slate-800">
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={() => handleDelete(activeDeleteDialog.type, activeDeleteDialog.id)}
                className="bg-red-900 hover:bg-red-800 text-red-100"
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default SemesterFlashcards; 