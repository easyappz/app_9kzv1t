import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UploadPhoto from './pages/UploadPhoto';
import Rating from './pages/Rating';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/upload-photo" element={<UploadPhoto />} />
          <Route path="/rating" element={<Rating />} />
          <Route path="/" element={<div>Добро пожаловать! Перейдите на <a href="/upload-photo">страницу загрузки фотографий</a> или <a href="/rating">страницу оценки</a>.</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
