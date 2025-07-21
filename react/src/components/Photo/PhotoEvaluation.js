import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Select, Slider, Rate, Spin, message, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { instance } from '../../api/axios';

const { Title, Text } = Typography;

const PhotoEvaluation = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ gender: '', minAge: 0, maxAge: 100 });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchPhotos();
  }, [filters, user, navigate]);

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const response = await instance.get('/api/photos-for-evaluation', {
        params: {
          gender: filters.gender || undefined,
          minAge: filters.minAge || undefined,
          maxAge: filters.maxAge || undefined
        },
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setPhotos(response.data);
    } catch (error) {
      message.error(error.response?.data?.error || 'Ошибка при загрузке фотографий');
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async (photoId, score) => {
    try {
      await instance.post(`/api/rate-photo/${photoId}`, { score }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      message.success('Оценка сохранена');
      setPhotos(photos.filter(photo => photo._id !== photoId));
    } catch (error) {
      message.error(error.response?.data?.error || 'Ошибка при оценке');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="app-container">
      <Card style={{ padding: 20, marginBottom: 20 }}>
        <Title level={2} style={{ textAlign: 'center' }}>Оценить фотографии</Title>
        <div className="filter-container">
          <div style={{ flex: 1, minWidth: '200px' }}>
            <Text>Пол:</Text>
            <Select
              value={filters.gender}
              onChange={(value) => handleFilterChange('gender', value)}
              style={{ width: '100%' }}
              placeholder="Выберите пол"
            >
              <Select.Option value="">Все</Select.Option>
              <Select.Option value="male">Мужской</Select.Option>
              <Select.Option value="female">Женский</Select.Option>
              <Select.Option value="other">Другое</Select.Option>
            </Select>
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <Text>Возраст:</Text>
            <Slider
              range
              value={[filters.minAge, filters.maxAge]}
              onChange={([min, max]) => setFilters(prev => ({ ...prev, minAge: min, maxAge: max }))}
              min={0}
              max={100}
            />
          </div>
        </div>
      </Card>

      <Card style={{ padding: 20 }}>
        <Spin spinning={loading}>
          {photos.length > 0 ? (
            <div className="photo-grid">
              {photos.map(photo => (
                <div key={photo._id} className="photo-item">
                  <img src={photo.filePath} alt="Фото для оценки" />
                  <Rate
                    onChange={(value) => handleRate(photo._id, value)}
                    style={{ marginTop: 8 }}
                  />
                </div>
              ))}
            </div>
          ) : (
            !loading && <Empty description="Нет фотографий для оценки" />
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default PhotoEvaluation;
