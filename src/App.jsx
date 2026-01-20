import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import Layout from '../Layout.jsx';
import Home from '../Pages/Home';
import Shop from '../Pages/Shop';
import ProductDetails from '../Pages/ProductDetails';
import Checkout from '../Pages/Checkout';
import OrderStatus from '../Pages/OrderStatus';
import About from '../Pages/About';
import Contacts from '../Pages/Contacts';
import Delivery from '../Pages/Delivery';
import Warranty from '../Pages/Warranty';
import Admin from '../Pages/Admin';
import { createPageUrl } from './utils.js';
import ScrollToTop from './components/ScrollToTop.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 минут
      gcTime: 10 * 60 * 1000, // 10 минут (cacheTime переименован в gcTime в v5)
      // Отключаем автоматические обновления, которые могут вызывать циклы
      notifyOnChangeProps: ['data', 'error'], // Обновляем только при изменении данных или ошибок
    },
  },
});

function AppRoutes() {
  return (
    <Routes>
      <Route path="/admin" element={<Admin />} />
      <Route path={createPageUrl('Home')} element={<Home />} />
      <Route path={createPageUrl('Shop')} element={<Shop />} />
      <Route path={`${createPageUrl('ProductDetails')}/:slug`} element={<ProductDetails />} />
      <Route path={createPageUrl('ProductDetails')} element={<ProductDetails />} />
      <Route path={createPageUrl('Checkout')} element={<Checkout />} />
      <Route path={createPageUrl('OrderStatus')} element={<OrderStatus />} />
      <Route path={createPageUrl('About')} element={<About />} />
      <Route path={createPageUrl('Contacts')} element={<Contacts />} />
      <Route path={createPageUrl('Delivery')} element={<Delivery />} />
      <Route path={createPageUrl('Warranty')} element={<Warranty />} />
      {/* Редирект всех неизвестных страниц на главную */}
      <Route path="*" element={<Navigate to={createPageUrl('Home')} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <ScrollToTop />
        <Layout>
          <AppRoutes />
        </Layout>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

