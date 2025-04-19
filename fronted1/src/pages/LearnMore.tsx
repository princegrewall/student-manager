import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const LearnMore = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#1A1F2C] text-white">
      <Navbar />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <h1 className="text-3xl font-bold mb-6 text-center">About College Portal</h1>
          
          <div className="bg-[#222222] rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Welcome to College Portal</h2>
            
            <p className="mb-4 text-gray-300">
              College Portal is a comprehensive platform designed to streamline communication and resource management 
              between students, teachers, and administrators. Our mission is to enhance the educational experience 
              by providing a centralized hub for all academic activities.
            </p>
            
            <h3 className="text-xl font-semibold mt-6 mb-3 text-purple-400">Key Features</h3>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-300">
              <li><strong>Role-Based Access:</strong> Different interfaces for students, teachers, and coordinators</li>
              <li><strong>Library Management:</strong> Access to digital resources and library catalog</li>
              <li><strong>Curriculum Planning:</strong> Tools for teachers to manage and share curriculum materials</li>
              <li><strong>Club Management:</strong> Students can join and participate in various clubs</li>
              <li><strong>Attendance Tracking:</strong> Digital attendance system for better record-keeping</li>
              <li><strong>Semester Management:</strong> Tools for organizing academic terms and schedules</li>
            </ul>
            
            <h3 className="text-xl font-semibold mt-6 mb-3 text-purple-400">How It Works</h3>
            <p className="mb-4 text-gray-300">
              College Portal uses a role-based authentication system to provide personalized experiences. 
              Students can access their courses, clubs, and library resources. Teachers can manage curriculum, 
              track attendance, and access teaching materials. Coordinators can oversee clubs and manage semester schedules.
            </p>
            
            <p className="mb-6 text-gray-300">
              Our platform is built with modern web technologies to ensure a smooth, responsive experience 
              across all devices. Security is our top priority, with all data encrypted and protected.
            </p>
            
            <div className="flex justify-center mt-8">
              <Link to="/signup">
                <Button className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-md">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="bg-[#222222] rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-purple-400">Contact Us</h3>
            <p className="mb-2 text-gray-300">
              Have questions about College Portal? We're here to help!
            </p>
            <p className="text-gray-300">
              Email: <a href="mailto:support@collegeportal.com" className="text-purple-400 hover:underline">support@collegeportal.com</a>
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default LearnMore; 