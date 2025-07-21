import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { instance } from '../../api/axios';

const { Title } = Typography;

const ResetPassword = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get('token');

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await instance.post('/api/reset-password', {
        resetToken: resetToken || values.resetToken,
        newPassword: values.newPassword
      });
      message.success('Пароль успешно изменен');
      setSubmitted(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      message.error(error.response?.data?.error || 'Ошибка при изменении пароля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <Card style={{ width: 400, padding: 20 }}>
        <Title level={2} style={{ textAlign: 'center' }}>Сброс пароля</Title>
        {!submitted ? (
          <Form
            name="reset-password"
            onFinish={onFinish}
            layout="vertical"
            initialValues={{ resetToken: resetToken || '' }}
          >
            {!resetToken && (
              <Form.Item
                label="Токен сброса"
                name="resetToken"
                rules={[{ required: true, message: 'Введите токен сброса!' }]}
              >
                <Input placeholder="Введите токен сброса" />
              </Form.Item>
            )}
            <Form.Item
              label="Новый пароль"
              name="newPassword"
              rules={[{ required: true, message: 'Введите новый пароль!' }, { min: 6, message: 'Пароль должен быть не менее 6 символов!' }]}
            >
              <Input.Password placeholder="Введите новый пароль" />
            </Form.Item>

            <Form.Item
              label="Подтвердите новый пароль"
              name="confirmPassword"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Подтвердите новый пароль!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Пароли не совпадают!'));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="Подтвердите новый пароль" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                Сбросить пароль
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center' }}>
              <Link to="/login">Вернуться ко входу</Link>
            </div>
          </Form>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <p>Пароль успешно изменен. Вы будете перенаправлены на страницу входа.</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ResetPassword;
