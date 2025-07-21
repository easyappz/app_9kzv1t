import React, { useState, useEffect } from 'react';
import '../App.css';
import { instance } from '../api/axios';

function Profile() {
  const [userData, setUserData] = useState({ points: 0 });
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const pointsResponse = await instance.get('/points');
        const photosResponse = await instance.get('/my-photos');
        setUserData(pointsResponse.data);
        setPhotos(photosResponse.data);
        setLoading(false);
      } catch (err) {
        setError('Не удалось загрузить данные профиля. Попробуйте позже.');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleToggleActive = async (photoId, currentStatus) => {
    try {
      if (!currentStatus && userData.points < 1) {
        setNotification('Недостаточно баллов для активации фотографии.');
        return;
      }
      const response = await instance.put(`/photo/${photoId}/toggle-active`);
      setPhotos(photos.map(photo => 
        photo.id === photoId ? { ...photo, isActive: !currentStatus } : photo
      ));
      setUserData({ ...userData, points: response.data.points });
      setNotification(currentStatus ? 'Фотография деактивирована.' : 'Фотография активирована для оценки.');
    } catch (err) {
      setNotification('Ошибка при изменении статуса фотографии.');
    }
  };

  const handleDeletePhoto = async (photoId, isActive) => {
    try {
      if (isActive && userData.points < 1) {
        setNotification('Недостаточно баллов для удаления активной фотографии.');
        return;
      }
      const response = await instance.delete(`/photo/${photoId}`);
      setPhotos(photos.filter(photo => photo.id !== photoId));
      setUserData({ ...userData, points: response.data.points });
      setNotification('Фотография успешно удалена.');
    } catch (err) {
      setNotification('Ошибка при удалении фотографии.');
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="profile-container">
      <h1>Профиль пользователя</h1>
      <div className="profile-info">
        <h2>Баллы: {userData.points}</h2>
        {notification && <div className="notification">{notification}</div>}
      </div>
      <div className="photos-section">
        <h2>Ваши фотографии</h2>
        {photos.length === 0 ? (
          <p>У вас пока нет загруженных фотографий.</p>
        ) : (
          <div className="photos-grid">
            {photos.map(photo => (
              <div key={photo.id} className="photo-card">
                <img src={`/${photo.filePath}`} alt="Фото" className="photo-img" />
                <div className="photo-info">
                  <p>Статус: {photo.isActive ? 'Активна' : 'Неактивна'}</p>
                  <p>Всего оценок: {photo.totalRatings}</p>
                  <p>Средняя оценка: {photo.averageScore.toFixed(2)}</p>
                  <div className="stats-section">
                    <h3>Статистика по полу:</h3>
                    <ul>
                      {Object.entries(photo.genderStats).map(([gender, count]) => (
                        <li key={gender}>{gender}: {count}</li>
                      ))}
                    </ul>
                    <h3>Статистика по возрасту:</h3>
                    <ul>
                      {Object.entries(photo.ageStats).map(([range, count]) => (
                        <li key={range}>{range}: {count}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="photo-actions">
                    <button 
                      onClick={() => handleToggleActive(photo.id, photo.isActive)}
                      className={photo.isActive ? 'deactivate-btn' : 'activate-btn'}
                    >
                      {photo.isActive ? 'Деактивировать' : 'Активировать'}
                    </button>
                    <button 
                      onClick={() => handleDeletePhoto(photo.id, photo.isActive)}
                      className="delete-btn"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
