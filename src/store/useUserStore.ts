import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    setUserData: (data: { name: string; email: string; phone: string }) => void;
    clearUserData: () => void;
}

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            clientName: '',
            clientEmail: '',
            clientPhone: '',
            setUserData: (data) => set({
                clientName: data.name,
                clientEmail: data.email,
                clientPhone: data.phone
            }),
            clearUserData: () => set({
                clientName: '',
                clientEmail: '',
                clientPhone: ''
            }),
        }),
        {
            name: 'paws-bubbles-user-storage',
        }
    )
);
