import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../src/utils.js';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "../../Components/ui/sheet.jsx";
import { Button } from "../../Components/ui/button.jsx";
import { Separator } from "../../Components/ui/separator.jsx";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartDrawer({ 
  open, 
  onClose, 
  cartItems, 
  products, 
  onUpdateQuantity, 
  onRemoveItem,
  isLoading = false
}) {
  const getProduct = (productId) => products.find(p => p.id === productId);
  
  const subtotal = cartItems.reduce((sum, item) => {
    const product = getProduct(item.product_id);
    return sum + (product?.price || 0) * item.quantity;
  }, 0);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader className="space-y-1">
          <SheetTitle className="text-2xl font-bold">Корзина</SheetTitle>
          <p className="text-sm text-slate-500">
            {cartItems.length} {cartItems.length === 1 ? 'товар' : cartItems.length < 5 ? 'товара' : 'товаров'}
          </p>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto py-6 -mx-6 px-6">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Loader2 className="w-8 h-8 text-slate-400 animate-spin mb-4" />
                <p className="text-sm text-slate-500">Загрузка корзины...</p>
              </div>
            ) : cartItems.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-center py-12"
              >
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">Корзина пуста</h3>
                <p className="text-sm text-slate-500 mb-6">Добавьте товары для оформления заказа</p>
                <Button onClick={onClose} variant="outline" className="rounded-full">
                  Продолжить покупки
                </Button>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => {
                  const product = getProduct(item.product_id);
                  if (!product) return null;
                  
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex gap-4 p-3 rounded-xl bg-slate-50"
                    >
                      <div className="w-20 h-20 rounded-lg bg-white p-2 flex-shrink-0">
                        <img
                          src={product.image_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmMWY1ZjkiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlMmU3ZWYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0idXJsKCNhKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5NDk5YTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Qcm9kdWN0PC90ZXh0Pjwvc3ZnPg=='}
                          alt={product.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmMWY1ZjkiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlMmU3ZWYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0idXJsKCNhKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5NDk5YTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Qcm9kdWN0PC90ZXh0Pjwvc3ZnPg==';
                          }}
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-800 text-sm line-clamp-1">
                          {product.name}
                        </h4>
                        <p className="text-xs text-slate-500 mb-2">{product.brand}</p>
                        <p className="font-semibold text-slate-900">
                          {product.price?.toLocaleString('ru-RU')} ₽
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end justify-between">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemoveItem(item.id)}
                          className="h-7 w-7 text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        
                        <div className="flex items-center gap-2 bg-white rounded-full px-1 py-0.5 shadow-sm">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="h-6 w-6 rounded-full"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="h-6 w-6 rounded-full"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </div>
        
        {cartItems.length > 0 && (
          <div className="border-t border-slate-200 mt-8 pt-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Итого</span>
              <span className="text-2xl font-bold text-slate-900">
                {subtotal.toLocaleString('ru-RU')} ₽
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-8">
              Доставка рассчитывается при оформлении
            </p>
            <Link to={createPageUrl('Checkout')} onClick={onClose} className="block mt-2">
              <Button className="w-full h-12 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-lg hover:shadow-xl transition-all">
                Оформить заказ
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}