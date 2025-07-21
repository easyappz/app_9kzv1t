import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { Link } from 'react-router-dom';
import { instance } from '../../api/axios';

const { Title } = Typography;

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await instance.post('/api/forgot-password', values);
      message.success('Инструкции по восстановлению пароля отправлены на ваш email');
      setSubmitted(true);
    } catch (error) {
      message.error(error.response?.data?.error || 'Ошибка при запросе восстановления пароля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <Card style={{ width: 400, padding: 20 }}>
        <Title level={2} style={{ textAlign: 'center' }}>Восстановление пароля</Title>
        {!submitted ? (
          <Form
            name="forgot-password"
            onFinish={onFinish}
            layout="vertical"
          >
            <Form.Item
              label="Email"
              name="email"
              rules={[{ required: true, message: 'Введите ваш email!' }, { type: 'email', message: 'Неверный формат email!' }]}
            >
              <Input placeholder="Введите email" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                Отправить
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center' }}>
              <Link to="/login">Вернуться ко входу</Link>
            </div>
          </Form>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <p>Проверьте ваш email для получения инструкций по восстановлению пароля.</p>
            <Link to="/login">Вернуться ко входу</Link>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ForgotPassword;
