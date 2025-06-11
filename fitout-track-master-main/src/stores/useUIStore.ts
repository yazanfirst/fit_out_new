import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  theme: 'light' | 'dark'
  isSidebarOpen: boolean
  notifications: Array<{
    id: string
    message: string
    type: 'success' | 'error' | 'info' | 'warning'
  }>
  setTheme: (theme: 'light' | 'dark') => void
  toggleSidebar: () => void
  addNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void
  removeNotification: (id: string) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'light',
      isSidebarOpen: true,
      notifications: [],
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      addNotification: (message, type) =>
        set((state) => ({
          notifications: [
            ...state.notifications,
            { id: Date.now().toString(), message, type },
          ],
        })),
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((notification) => notification.id !== id),
        })),
    }),
    {
      name: 'ui-storage',
    }
  )
) 