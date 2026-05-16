import { create } from 'zustand';

export const useAppStore = create((set) => ({
  user: {
    id: 'u_88291a',
    name: 'Santhosh Kumar',
    points: 1540,
    level: 4,
    streak: 12
  },
  isConnected: false,
  
  setConnectionStatus: (status) => set({ isConnected: status }),
  updatePoints: (newPoints) => set((state) => ({ 
    user: { ...state.user, points: newPoints } 
  })),
  setUser: (userData) => set({ user: userData }),
}));