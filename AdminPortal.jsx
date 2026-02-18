import React from 'react';
import DocumentUpload from '../components/admin/DocumentUpload';
import ChatWidget from '../components/common/ChatWidget';

const AdminPortal = () => {
  return (
    <div>
       {/* 1. Main Full-Screen Layout */}
       <DocumentUpload />

       {/* 2. Floating Chat Widget */}
       <ChatWidget userType="admin" userName="Admin" />
    </div>
  );
};

export default AdminPortal;