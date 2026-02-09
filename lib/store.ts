import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SearchFilters {
  searchQuery: string;
  minPrice: number;
  maxPrice: number;
  setSearchQuery: (query: string) => void;
  setPriceRange: (min: number, max: number) => void;
  resetFilters: () => void;
}

const defaultMinPrice = 0;
const defaultMaxPrice = 100000;

export const useSearchFilters = create<SearchFilters>()(
  persist(
    (set) => ({
      searchQuery: '',
      minPrice: defaultMinPrice,
      maxPrice: defaultMaxPrice,
      setSearchQuery: (query: string) => set({ searchQuery: query }),
      setPriceRange: (min: number, max: number) => set({ minPrice: min, maxPrice: max }),
      resetFilters: () => set({ 
        searchQuery: '', 
        minPrice: defaultMinPrice, 
        maxPrice: defaultMaxPrice 
      }),
    }),
    {
      name: 'search-filters-storage',
    }
  )
);
