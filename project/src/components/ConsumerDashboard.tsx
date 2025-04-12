import React, { useEffect, useState } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar as CalendarIcon, MapPin, Bell, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Product {
  id: string;
  name: string;
  description: string;
  availability_start: string;
  availability_end: string;
  producer: {
    full_name: string;
    locations: {
      name: string;
      address: string;
    }[];
  };
}

export function ConsumerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    fetchProducts();
    fetchFavorites();
  }, []);

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          producer:producer_id (
            full_name,
            locations (
              name,
              address
            )
          )
        `)
        .gte('availability_start', format(startOfWeek(selectedDate), 'yyyy-MM-dd'))
        .lte('availability_end', format(addDays(startOfWeek(selectedDate), 6), 'yyyy-MM-dd'));

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      alert('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  }

  async function fetchFavorites() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setFavorites(data?.map(f => f.product_id) || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  }

  async function toggleFavorite(productId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Veuillez vous connecter pour ajouter des favoris');
        return;
      }

      if (favorites.includes(productId)) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);
        setFavorites(favorites.filter(id => id !== productId));
      } else {
        await supabase
          .from('favorites')
          .insert([{ user_id: user.id, product_id: productId }]);
        setFavorites([...favorites, productId]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Erreur lors de la mise à jour des favoris');
    }
  }

  function getWeekDays() {
    const start = startOfWeek(selectedDate, { locale: fr });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Produits de la Semaine
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700">
            <Bell className="h-4 w-4 mr-2" />
            Activer les Alertes
          </button>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="grid grid-cols-7 gap-px">
          {getWeekDays().map((date) => (
            <button
              key={date.toString()}
              onClick={() => setSelectedDate(date)}
              className={`
                p-4 text-center hover:bg-emerald-50
                ${isSameDay(date, selectedDate) ? 'bg-emerald-100' : 'bg-white'}
              `}
            >
              <span className="text-sm font-medium text-gray-900">
                {format(date, 'EEE', { locale: fr })}
              </span>
              <span className="block text-lg font-semibold text-gray-900">
                {format(date, 'd', { locale: fr })}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">{product.name}</h3>
                <button
                  onClick={() => toggleFavorite(product.id)}
                  className={`p-2 rounded-full ${
                    favorites.includes(product.id)
                      ? 'text-red-500 hover:text-red-600'
                      : 'text-gray-400 hover:text-gray-500'
                  }`}
                >
                  <Heart className="h-6 w-6" fill={favorites.includes(product.id) ? 'currentColor' : 'none'} />
                </button>
              </div>
              <p className="mt-2 text-gray-600">{product.description}</p>
              
              <div className="mt-4">
                <div className="flex items-center text-sm text-gray-500">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  <span>
                    {format(new Date(product.availability_start), 'dd MMM', { locale: fr })} -{' '}
                    {format(new Date(product.availability_end), 'dd MMM', { locale: fr })}
                  </span>
                </div>
                
                {product.producer?.locations?.map((location, index) => (
                  <div key={index} className="mt-2 flex items-center text-sm text-gray-500">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{location.name} - {location.address}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}