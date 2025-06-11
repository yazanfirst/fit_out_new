import { create } from 'zustand'

interface DataState<T> {
  data: T[]
  isLoading: boolean
  error: string | null
  setData: (data: T[]) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  addItem: (item: T) => void
  updateItem: (id: string, item: Partial<T>) => void
  removeItem: (id: string) => void
}

export const createDataStore = <T extends { id: string }>() =>
  create<DataState<T>>((set) => ({
    data: [],
    isLoading: false,
    error: null,
    setData: (data) => set({ data }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    addItem: (item) => set((state) => ({ data: [...state.data, item] })),
    updateItem: (id, item) =>
      set((state) => ({
        data: state.data.map((i) => (i.id === id ? { ...i, ...item } : i)),
      })),
    removeItem: (id) =>
      set((state) => ({
        data: state.data.filter((i) => i.id !== id),
      })),
  })) 