import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './components/Landing';
import Dashboard from './components/Dashboard';
import Symptoms from './components/Symptoms';
import Precautions from './components/Precautions';
import Diet from './components/Diet';

function App() {
  return (
    <Router>
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
