'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CategoryCard from './CategoryCard';

const CATEGORIES = [
  {
    name: 'iPhone',
    query: 'iphone',
    icon: '/icons/categories/iphone.svg',
    gradient: 'bg-gradient-to-br from-emerald-100 to-emerald-200',
  },
  {
    name: 'Laptops',
    query: 'laptop',
    icon: '/icons/categories/laptops.svg',
    gradient: 'bg-gradient-to-br from-cyan-100 to-cyan-200',
  },
  {
    name: 'Electrodomésticos',
    query: 'electrodomesticos',
    icon: '/icons/categories/electrodomesticos.svg',
    gradient: 'bg-gradient-to-br from-sky-100 to-sky-200',
  },
  {
    name: 'Televisores',
    query: 'televisor',
    icon: '/icons/categories/televisor.svg',
    gradient: 'bg-gradient-to-br from-indigo-100 to-indigo-200',
  },
  {
    name: 'Videojuegos',
    query: 'videojuegos',
    icon: '/icons/categories/videojuegos.svg',
    gradient: 'bg-gradient-to-br from-purple-100 to-purple-200',
  },
  {
    name: 'Hogar',
    query: 'hogar',
    icon: '/icons/categories/hogar.svg',
    gradient: 'bg-gradient-to-br from-rose-100 to-rose-200',
  },
  {
    name: 'Mercado',
    query: 'mercado',
    icon: '/icons/categories/mercado.svg',
    gradient: 'bg-gradient-to-br from-lime-100 to-lime-200',
  },
];

export default function CategoryWall() {
  const [categories, setCategories] = useState(CATEGORIES);

  useEffect(() => {
    const interval = setInterval(() => {
      setCategories(prev => {
        const shuffled = [...prev];
        // Shuffle randomly
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-zinc-50 to-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-zinc-900 mb-4">
            Explora por <span className="text-emerald-600">Categoría</span>
          </h2>
          <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
            Descubre las mejores ofertas en las categorías más populares
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {categories.map((category, index) => (
              <motion.div
                key={category.name}
                layout
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 25,
                }}
              >
                <CategoryCard
                  {...category}
                  index={index}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-zinc-500">
            Las categorías se actualizan cada 4 segundos • Haz clic para buscar
          </p>
        </motion.div>
      </div>
    </section>
  );
}
