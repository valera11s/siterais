import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from "../Components/ui/button.jsx";
import { Input } from "../Components/ui/input.jsx";
import { Textarea } from "../Components/ui/textarea.jsx";
import { Label } from "../Components/ui/label.jsx";
import { Phone, Mail, MapPin, Clock, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Contacts() {
  // Скролл наверх при открытии страницы
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const { data: settings = {} } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/api/settings`);
      if (!response.ok) throw new Error('Ошибка загрузки настроек');
      return response.json();
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name')?.trim() || '',
      phone: formData.get('phone')?.trim() || '',
      email: formData.get('email')?.trim() || '',
      message: formData.get('message')?.trim() || '',
    };

    // Валидация на фронтенде
    if (!data.name) {
      toast.error('Пожалуйста, укажите ваше имя');
      return;
    }

    if (!data.message) {
      toast.error('Пожалуйста, напишите сообщение');
      return;
    }

    if (!data.phone) {
      toast.error('Пожалуйста, укажите ваш телефон');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Ошибка отправки сообщения');
      }
      
      toast.success('Сообщение отправлено! Мы свяжемся с вами в ближайшее время.');
      e.target.reset();
    } catch (error) {
      toast.error(error.message || 'Ошибка отправки сообщения. Попробуйте позже.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Заголовок */}
      <div className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold mb-4">Контакты</h1>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Свяжитесь с нами любым удобным способом. Мы всегда рады помочь!
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Контактная информация */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Наши контакты</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Телефон</h3>
                    {settings.phone ? (
                      <a href={`tel:+${settings.phone_formatted || settings.phone.replace(/\D/g, '')}`} className="text-slate-600 hover:text-slate-900">
                        {settings.phone}
                      </a>
                    ) : (
                      <p className="text-slate-600">-</p>
                    )}
                  </div>
                </div>

                {settings.email && (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Email</h3>
                      <a href={`mailto:${settings.email}`} className="text-slate-600 hover:text-slate-900">
                        {settings.email}
                      </a>
                    </div>
                  </div>
                )}

                {settings.address && (
                  <>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">Адрес</h3>
                        <p className="text-slate-600 whitespace-pre-line">{settings.address}</p>
                      </div>
                    </div>
                    {/* Мини карта Яндекс */}
                    <div className="mt-6 rounded-xl overflow-hidden shadow-sm border border-slate-200">
                      <iframe
                        src="https://yandex.ru/map-widget/v1/-/CLtU7208"
                        width="100%"
                        height="300"
                        frameBorder="0"
                        allowFullScreen
                        style={{ border: 0 }}
                        title="Карта магазина"
                      />
                    </div>
                  </>
                )}

                {settings.working_hours && (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Режим работы</h3>
                      <p className="text-slate-600 whitespace-pre-line">{settings.working_hours}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Форма обратной связи */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Напишите нам</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Имя *</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      placeholder="Ваше имя" 
                      className="mt-1.5 rounded-xl" 
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Телефон *</Label>
                    <Input 
                      id="phone" 
                      name="phone" 
                      placeholder="+7 (999) 123-45-67" 
                      className="mt-1.5 rounded-xl" 
                      required 
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    placeholder="example@mail.ru" 
                    className="mt-1.5 rounded-xl" 
                  />
                </div>
                <div>
                  <Label htmlFor="message">Сообщение *</Label>
                  <Textarea 
                    id="message" 
                    name="message" 
                    placeholder="Ваше сообщение..." 
                    className="mt-1.5 rounded-xl h-32" 
                    required 
                  />
                </div>
                <Button type="submit" className="w-full h-12 rounded-full bg-slate-900 hover:bg-slate-800">
                  <Send className="w-4 h-4 mr-2" />
                  Отправить сообщение
                </Button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}