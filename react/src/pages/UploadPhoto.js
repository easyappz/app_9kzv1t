import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { instance } from '../api/axios';
import { Button, Upload, message, List, Card, Statistic, Row, Col, Divider, Modal, Typography } from 'antd';
import { UploadOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const UploadPhoto = () => {
  const [fileList, setFileList] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserPhotos();
    fetchUserPoints();
  }, []);

  const fetchUserPhotos = async () => {
    setLoading(true);
    try {
      const response = await instance.get('/my-photos');
      setPhotos(response.data);
    } catch (error) {
      message.error('Не удалось загрузить фотографии: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPoints = async () => {
    try {
      const response = await instance.get('/points');
      setUserPoints(response.data.points);
    } catch (error) {
      message.error('Не удалось загрузить баллы: ' + error.message);
    }
  };

  const handleUploadChange = ({ fileList }) => {
    setFileList(fileList);
  };

  const handleUpload = async (options) => {
    const { file, onSuccess, onError } = options;
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const response = await instance.post('/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onSuccess(response.data);
      message.success('Фотография успешно загружена');
      fetchUserPhotos();
    } catch (error) {
      onError(error);
      message.error('Ошибка при загрузке фотографии: ' + error.message);
    }
  };

  const handleToggleActive = async (photoId, isActive) => {
    if (!isActive && userPoints < 1) {
      message.error('Недостаточно баллов для активации фотографии. Требуется минимум 1 балл.');
      return;
    }
    try {
      const response = await instance.put(`/photo/${photoId}/toggle-active`);
      message.success(response.data.message === 'Photo activated for evaluation' ? 'Фотография активирована для оценки' : 'Фотография деактивирована');
      setUserPoints(response.data.points);
      fetchUserPhotos();
    } catch (error) {
      message.error('Ошибка при изменении статуса фотографии: ' + error.message);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    try {
      const response = await instance.delete(`/photo/${photoId}`);
      message.success('Фотография удалена');
      setUserPoints(response.data.points);
      fetchUserPhotos();
    } catch (error) {
      message.error('Ошибка при удалении фотографии: ' + error.message);
    }
  };

  const handleViewStats = (photo) => {
    setSelectedPhoto(photo);
    setStatsModalVisible(true);
  };

  const uploadProps = {
    onChange: handleUploadChange,
    customRequest: handleUpload,
    fileList,
    listType: 'picture',
    maxCount: 1,
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>Управление фотографиями</Title>
      <Text type="secondary">Здесь вы можете загружать свои фотографии и управлять ими. Текущие баллы: {userPoints}</Text>
      
      <Divider />
      <Row gutter={16} style={{ marginBottom: '20px' }}>
        <Col span={24}>
          <Card title="Загрузить новую фотографию" bordered={false}>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>Выбрать фотографию</Button>
            </Upload>
            <Text type="secondary">Выберите изображение для загрузки. После загрузки вы сможете добавить его в список оцениваемых.</Text>
          </Card>
        </Col>
      </Row>

      <Divider>Ваши фотографии</Divider>
      <List
        loading={loading}
        grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
        dataSource={photos}
        renderItem={(photo) => (
          <List.Item>
            <Card
              hoverable
              cover={<img alt="Фото" src={photo.filePath} style={{ height: '200px', objectFit: 'cover' }} />}
              actions={[
                <Button
                  key="toggle"
                  type={photo.isActive ? 'default' : 'primary'}
                  onClick={() => handleToggleActive(photo.id, photo.isActive)}
                >
                  {photo.isActive ? 'Деактивировать' : 'Активировать'}
                </Button>,
                <Button
                  key="stats"
                  icon={<EyeOutlined />}
                  onClick={() => handleViewStats(photo)}
                >
                  Статистика
                </Button>,
                <Button
                  key="delete"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeletePhoto(photo.id)}
                >
                  Удалить
                </Button>
              ]}
            >
              <Card.Meta
                title={photo.isActive ? 'Активна для оценки' : 'Неактивна'}
                description={`Средняя оценка: ${photo.averageScore.toFixed(2)} (${photo.totalRatings} оценок)`}
              />
            </Card>
          </List.Item>
        )}
      />

      <Modal
        title="Статистика по фотографии"
        open={statsModalVisible}
        onOk={() => setStatsModalVisible(false)}
        onCancel={() => setStatsModalVisible(false)}
        width={800}
      >
        {selectedPhoto && (
          <div>
            <img
              alt="Фото"
              src={selectedPhoto.filePath}
              style={{ width: '100%', height: '300px', objectFit: 'cover', marginBottom: '20px' }}
            />
            <Row gutter={16}>
              <Col span={12}>
                <Statistic title="Общее количество оценок" value={selectedPhoto.totalRatings} />
              </Col>
              <Col span={12}>
                <Statistic title="Средняя оценка" value={selectedPhoto.averageScore.toFixed(2)} />
              </Col>
            </Row>
            <Divider>Статистика по полу</Divider>
            <Row gutter={16}>
              {Object.entries(selectedPhoto.genderStats).map(([gender, count]) => (
                <Col span={8} key={gender}>
                  <Statistic
                    title={gender === 'male' ? 'Мужчины' : gender === 'female' ? 'Женщины' : 'Другое'}
                    value={count}
                  />
                </Col>
              ))}
            </Row>
            <Divider>Статистика по возрасту</Divider>
            <Row gutter={16}>
              {Object.entries(selectedPhoto.ageStats).map(([ageRange, count]) => (
                <Col span={6} key={ageRange}>
                  <Statistic
                    title={ageRange === 'under20' ? 'До 20' : ageRange === '20-30' ? '20-30' : ageRange === '30-40' ? '30-40' : '40+'}
                    value={count}
                  />
                </Col>
              ))}
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UploadPhoto;
