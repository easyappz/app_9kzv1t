import React, { useState } from 'react';
import { Upload, Button, Card, Typography, message, Spin } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { instance } from '../../api/axios';

const { Title } = Typography;

const PhotoUpload = () => {
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.error('Выберите файл для загрузки');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('photo', fileList[0]);

    try {
      await instance.post('/api/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      message.success('Фото успешно загружено');
      setFileList([]);
      navigate('/my-photos');
    } catch (error) {
      message.error(error.response?.data?.error || 'Ошибка при загрузке фото');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = ({ fileList }) => setFileList(fileList.slice(-1));

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="app-container">
      <Card style={{ padding: 20 }}>
        <Title level={2} style={{ textAlign: 'center' }}>Загрузить фотографию</Title>
        <Spin spinning={loading}>
          <Upload
            fileList={fileList}
            onChange={handleChange}
            beforeUpload={() => false}
            accept="image/*"
            listType="picture"
          >
            <Button icon={<UploadOutlined />}>Выбрать фото</Button>
          </Upload>
          <Button
            type="primary"
            onClick={handleUpload}
            disabled={fileList.length === 0}
            loading={loading}
            style={{ marginTop: 16 }}
            block
          >
            Загрузить
          </Button>
        </Spin>
      </Card>
    </div>
  );
};

export default PhotoUpload;
