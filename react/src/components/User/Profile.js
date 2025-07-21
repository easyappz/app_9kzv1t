import React, { useState, useEffect } from 'react';
import { Card, Typography, Form, Input, Button, Select, InputNumber, message, Spin, Statistic } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { instance } from '../../api/axios';

const { Title, Text } = Typography;

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [form] = Form.useForm();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchUserData();
  }, [user, navigate]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const pointsResponse = await instance.get('/api/points', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setPoints(pointsResponse.data.points);
      form.setFieldsValue({ email: user.email });
    } catch (error) {
      message.error(error.response?.data?.error || 'Ошибка при загрузке данных пользователя');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await instance.put('/api/profile', values, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      message.success('Профиль обновлен');
    } catch (error) {
      message.error(error.response?.data?.error || 'Ошибка при обновлении профиля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Card style={{ padding: 20 }}>
        <Title level={2} style={{ textAlign: 'center' }}>Профиль</Title>
        <Spin spinning={loading}>
          <Statistic title="Ваши баллы" value={points} style={{ marginBottom: 20, textAlign: 'center' }} />
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
          >
            <Form.Item
              label="Email"
              name="email"
            >
              <Input disabled />
            </Form.Item>
            <Form.Item
              label="Пол"
              name="gender"
            >
              <Select placeholder="Выберите пол">
                <Select.Option value="male">Мужской</Select.Option>
                <Select.Option value="female">Женский</Select.Option>
                <Select.Option value="other">Другое</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="Возраст"
              name="age"
            >
              <InputNumber min={0} max={120} placeholder="Введите возраст" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Сохранить изменения
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
    </div>
  );
};

export default Profile;
