import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Sprout, Bell, Sun } from 'lucide-react';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { ProducerDashboard } from './components/ProducerDashboard';
import { ConsumerDashboard } from './components/ConsumerDashboard';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<'producer' | 'consumer' | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserType(session.user.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        await fetchUserType(session.user.id);
      } else {
        setUserType(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserType(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUserType(data.user_type);
    } catch (error) {
      console.error('Error fetching user type:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Sprout className="h-8 w-8 text-emerald-600" />
                <h1 className="text-2xl font-semibold text-gray-900">Saisonnalité</h1>
              </div>
              <nav className="flex items-center space-x-4">
                {session ? (
                  <>
                    {userType === 'producer' ? (
                      <button
                        onClick={() => window.location.href = '/dashboard'}
                        className="px-4 py-2 text-sm font-medium text-emerald-700 hover:text-emerald-800"
                      >
                        Tableau de Bord
                      </button>
                    ) : (
                      <button
                        onClick={() => window.location.href = '/products'}
                        className="px-4 py-2 text-sm font-medium text-emerald-700 hover:text-emerald-800"
                      >
                        Produits de Saison
                      </button>
                    )}
                    <button
                      onClick={() => supabase.auth.signOut()}
                      className="px-4 py-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      Déconnexion
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => window.location.href = '/login'}
                      className="px-4 py-2 text-sm font-medium text-emerald-700 hover:text-emerald-800"
                    >
                      Connexion
                    </button>
                  </>
                )}
              </nav>
            </div>
          </div>
        </header>

        <Routes>
          <Route
            path="/login"
            element={session ? <Navigate to="/" /> : <Auth />}
          />
          <Route
            path="/dashboard"
            element={
              session && userType === 'producer' ? (
                <ProducerDashboard />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/products"
            element={
              session && userType === 'consumer' ? (
                <ConsumerDashboard />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/"
            element={
              session ? (
                <Navigate to={userType === 'producer' ? '/dashboard' : '/products'} />
              ) : (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                  <div className="text-center">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                      Découvrez les produits de saison près de chez vous
                    </h2>
                    <p className="text-xl text-gray-600 mb-8">
                      Connectez-vous directement avec les producteurs locaux et accédez à des produits frais et de saison
                    </p>
                  </div>

                  {/* Feature Cards */}
                  <div className="grid md:grid-cols-3 gap-8 mt-12">
                    <FeatureCard
                      icon={<Calendar className="h-6 w-6" />}
                      title="Calendrier Interactif"
                      description="Consultez la disponibilité des produits semaine par semaine"
                    />
                    <FeatureCard
                      icon={<MapPin className="h-6 w-6" />}
                      title="Producteurs Locaux"
                      description="Trouvez les producteurs les plus proches de chez vous"
                    />
                    <FeatureCard
                      icon={<Bell className="h-6 w-6" />}
                      title="Alertes Personnalisées"
                      description="Soyez notifié quand vos produits préférés sont disponibles"
                    />
                  </div>

                  {/* Weather Section */}
                  <div className="mt-16 bg-white rounded-lg shadow-lg p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <Sun className="h-8 w-8 text-yellow-500" />
                      <h3 className="text-xl font-semibold">Prévisions Météo Agricoles</h3>
                    </div>
                    <div className="grid grid-cols-5 gap-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="text-center p-4 rounded-lg bg-gray-50">
                          <p className="text-sm text-gray-600">{getDay(i)}</p>
                          <Sun className="h-8 w-8 mx-auto my-2 text-yellow-500" />
                          <p className="text-lg font-medium">22°C</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="text-emerald-600 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function getDay(offset) {
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return days[date.getDay()];
}

export default App;