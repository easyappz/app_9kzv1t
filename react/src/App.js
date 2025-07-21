import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UploadPhoto from './pages/UploadPhoto';
import Rating from './pages/Rating';
import Profile from './pages/Profile';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/upload-photo" element={<UploadPhoto />} />
          <Route path="/rating" element={<Rating />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/" element={<div>Добро пожаловать! Перейдите на <a href="/upload-photo">страницу загрузки фотографий</a>, <a href="/rating">страницу оценки</a> или <a href="/profile">страницу профиля</a>.</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
