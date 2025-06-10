import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to track hub as the main page
    navigate('/track-hub');
  }, [navigate]);

  return (
    <div className="text-center py-8">
      <p>Redirecting...</p>
    </div>
  );
};

export default Index;