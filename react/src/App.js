import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UploadPhoto from './pages/UploadPhoto';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/upload-photo" element={<UploadPhoto />} />
          <Route path="/" element={<div>Добро пожаловать! Перейдите на <a href="/upload-photo">страницу загрузки фотографий</a>.</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
