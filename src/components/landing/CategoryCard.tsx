'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

interface CategoryCardProps {
  name: string;
  icon: string;
  query: string;
  gradient: string;
  index: number;
}

export default function CategoryCard({ name, icon, query, gradient, index }: CategoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotate: -1 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ scale: 1.03, rotate: 0 }}
      className="group"
    >
      <Link href={`/buscar?q=${encodeURIComponent(query)}`}>
        <div className={`relative aspect-[16/10] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 ${gradient}`}>
          {/* Glass effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent backdrop-blur-sm" />
          
          {/* Content */}
          <div className="relative h-full flex flex-col items-center justify-center p-6">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Image
                src={icon}
                alt={name}
                width={64}
                height={64}
                className="mb-4 drop-shadow-lg"
              />
            </motion.div>
            
            <h3 className="text-xl font-bold text-zinc-900 mb-2 text-center">
              {name}
            </h3>
            
            <span className="text-sm font-medium text-emerald-600 group-hover:text-emerald-700 flex items-center gap-1">
              Buscar
              <svg
                className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </span>
          </div>

          {/* Shine effect on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
