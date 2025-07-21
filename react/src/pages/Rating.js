import React, { useState, useEffect } from 'react';
import '../styles/Rating.css';
import { instance } from '../api/axios';

function Rating() {
  const [photo, setPhoto] = useState(null);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    gender: '',
    minAge: '',
    maxAge: ''
  });

  useEffect(() => {
    fetchPoints();
    fetchPhoto();
  }, [filters]);

  const fetchPoints = async () => {
    try {
      const response = await instance.get('/api/points');
      setPoints(response.data.points);
    } catch (err) {
      setError('Не удалось загрузить баллы.');
      console.error(err);
    }
  };

  const fetchPhoto = async () => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams();
      if (filters.gender) query.append('gender', filters.gender);
      if (filters.minAge) query.append('minAge', filters.minAge);
      if (filters.maxAge) query.append('maxAge', filters.maxAge);

      const response = await instance.get(`/api/photos-for-evaluation?${query.toString()}`);
      if (response.data.length > 0) {
        setPhoto(response.data[0]);
      } else {
        setPhoto(null);
        setError('Фотографии не найдены с текущими фильтрами.');
      }
    } catch (err) {
      setError('Не удалось загрузить фотографию.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleRate = async (score) => {
    if (!photo) return;
    try {
      await instance.post(`/api/rate-photo/${photo._id}`, { score });
      setPoints(points + 1);
      fetchPhoto();
    } catch (err) {
      setError('Не удалось оценить фотографию.');
      console.error(err);
    }
  };

  return (
    <div className="rating-container">
      <header className="rating-header">
        <h1>Оценка фотографий</h1>
        <div className="points-display">
          <span>Ваши баллы: {points}</span>
        </div>
      </header>

      <div className="filters-section">
        <h2>Фильтры</h2>
        <div className="filter-group">
          <label>Пол:</label>
          <select name="gender" value={filters.gender} onChange={handleFilterChange}>
            <option value="">Все</option>
            <option value="male">Мужской</option>
            <option value="female">Женский</option>
            <option value="other">Другое</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Возраст от:</label>
          <input
            type="number"
            name="minAge"
            value={filters.minAge}
            onChange={handleFilterChange}
            placeholder="Любой"
          />
        </div>
        <div className="filter-group">
          <label>Возраст до:</label>
          <input
            type="number"
            name="maxAge"
            value={filters.maxAge}
            onChange={handleFilterChange}
            placeholder="Любой"
          />
        </div>
      </div>

      <div className="photo-section">
        {loading ? (
          <p>Загрузка фотографии...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : photo ? (
          <div className="photo-container">
            <img src={`/${photo.filePath}`} alt="Фото для оценки" className="photo" />
            <div className="rating-buttons">
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  onClick={() => handleRate(score)}
                  className="rate-button"
                >
                  {score}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p>Фотографии для оценки не найдены.</p>
        )}
      </div>
    </div>
  );
}

export default Rating;
