import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Landing from './components/Landing';
import Dashboard from './components/Dashboard';
import Symptoms from './components/Symptoms';
import Precautions from './components/Precautions';
import Diet from './components/Diet';

const TitleManager = () => {
  const location = useLocation();

  useEffect(() => {
    const titles = {
      '/': 'TB Diagnostic System - Home',
      '/screening': 'TB Diagnostic System - Screening',
      '/symptoms': 'TB Diagnostic System - Symptoms Guide',
      '/precautions': 'TB Diagnostic System - Safety Precautions',
      '/diet': 'TB Diagnostic System - Nutritional Guide'
    };
    document.title = titles[location.pathname] || 'TB Diagnostic System';
  }, [location]);

  return null;
};

function App() {
  return (
    <Router>
      <TitleManager />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/screening" element={<Dashboard />} />
        <Route path="/symptoms" element={<Symptoms />} />
        <Route path="/precautions" element={<Precautions />} />
        <Route path="/diet" element={<Diet />} />
      </Routes>
    </Router>
  );
}

export default App;
