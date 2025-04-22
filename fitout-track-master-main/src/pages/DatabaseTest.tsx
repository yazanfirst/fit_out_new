import React from 'react';
import Navbar from '@/components/Navbar';
import DatabaseTest from '@/components/DatabaseTest';

const DatabaseTestPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">Database Connection Test</h1>
        <p className="mb-6 text-gray-600">
          This page allows you to test direct database operations to verify your Supabase connection.
          Use the buttons below to create test users, projects, and assign users to projects directly in the database.
        </p>
        
        <DatabaseTest />
      </div>
    </div>
  );
};

export default DatabaseTestPage; 