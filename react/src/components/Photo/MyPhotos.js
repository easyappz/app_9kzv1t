import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Switch, Spin, message, Empty, Statistic, Row, Col } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { instance } from '../../api/axios';

const { Title, Text } = Typography;

const MyPhotos = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchPhotos();
  }, [user, navigate]);

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const response = await instance.get('/api/my-photos', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setPhotos(response.data);
    } catch (error) {
      message.error(error.response?.data?.error || 'Ошибка при загрузке фотографий');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (photoId, checked) => {
    try {
      await instance.put(`/api/photo/${photoId}/toggle-active`, {}, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      message.success(checked ? 'Фото активировано для оценки' : 'Фото деактивировано');
      fetchPhotos();
    } catch (error) {
      message.error(error.response?.data?.error || 'Ошибка при изменении статуса фото');
    }
  };

  const handleDelete = async (photoId) => {
    try {
      await instance.delete(`/api/photo/${photoId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      message.success('Фото удалено');
      fetchPhotos();
    } catch (error) {
      message.error(error.response?.data?.error || 'Ошибка при удалении фото');
    }
  };

  return (
    <div className="app-container">
      <Card style={{ padding: 20 }}>
        <Title level={2} style={{ textAlign: 'center' }}>Мои фотографии</Title>
        <Spin spinning={loading}>
          {photos.length > 0 ? (
            <div className="photo-grid">
              {photos.map(photo => (
                <div key={photo.id} className="photo-item">
                  <img src={photo.filePath} alt="Мое фото" />
                  <div style={{ marginTop: 8 }}>
                    <Text>Активно для оценки: </Text>
                    <Switch
                      checked={photo.isActive}
                      onChange={(checked) => handleToggleActive(photo.id, checked)}
                    />
                  </div>
                  <Button
                    danger
                    onClick={() => handleDelete(photo.id)}
                    style={{ marginTop: 8 }}
                  >
                    Удалить
                  </Button>
                  <div style={{ marginTop: 16 }}>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic title="Средняя оценка" value={photo.averageScore.toFixed(1)} />
                      </Col>
                      <Col span={12}>
                        <Statistic title="Всего оценок" value={photo.totalRatings} />
                      </Col>
                    </Row>
                    <Text type="secondary">Статистика по полу:</Text>
                    <ul>
                      {Object.entries(photo.genderStats).map(([gender, count]) => (
                        <li key={gender}>{gender}: {count}</li>
                      ))}
                    </ul>
                    <Text type="secondary">Статистика по возрасту:</Text>
                    <ul>
                      {Object.entries(photo.ageStats).map(([range, count]) => (
                        <li key={range}>{range}: {count}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !loading && <Empty description="У вас нет загруженных фотографий" />
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default MyPhotos;
