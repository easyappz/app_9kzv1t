import React from 'react';
import { Layout as AntLayout, Menu, Button } from 'antd';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserOutlined, UploadOutlined, StarOutlined, PictureOutlined, LogoutOutlined } from '@ant-design/icons';

const { Header, Content, Footer } = AntLayout;

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = user
    ? [
        { key: '/profile', label: <Link to="/profile">Профиль</Link>, icon: <UserOutlined /> },
        { key: '/upload', label: <Link to="/upload">Загрузить фото</Link>, icon: <UploadOutlined /> },
        { key: '/evaluate', label: <Link to="/evaluate">Оценить фото</Link>, icon: <StarOutlined /> },
        { key: '/my-photos', label: <Link to="/my-photos">Мои фото</Link>, icon: <PictureOutlined /> },
        { key: 'logout', label: <span onClick={handleLogout}>Выйти</span>, icon: <LogoutOutlined /> }
      ]
    : [
        { key: '/login', label: <Link to="/login">Вход</Link> },
        { key: '/register', label: <Link to="/register">Регистрация</Link> }
      ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
        <div className="logo" style={{ float: 'left', fontSize: '20px', fontWeight: 'bold' }}>
          ФотоОценка
        </div>
        <Menu
          mode="horizontal"
          items={menuItems}
          selectedKeys={[location.pathname]}
          style={{ float: 'right' }}
        />
      </Header>
      <Content style={{ padding: '24px', margin: '0 auto', maxWidth: '1200px', width: '100%' }}>
        <Outlet />
      </Content>
      <Footer style={{ textAlign: 'center', background: '#fff' }}>
        ФотоОценка ©2023
      </Footer>
    </AntLayout>
  );
};

export default Layout;
