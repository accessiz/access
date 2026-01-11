'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type AnimationState = 'intro' | 'logo-to-nav' | 'login' | 'transition' | 'finished';

interface ClientAnimationContextType {
    animationState: AnimationState;
    setAnimationState: (state: AnimationState) => void;
    startExitAnimation: () => Promise<void>;
    introPlayed: boolean;
}

const ClientAnimationContext = createContext<ClientAnimationContextType | undefined>(undefined);

export function ClientAnimationProvider({ children }: { children: ReactNode }) {
    const [animationState, setAnimationState] = useState<AnimationState>('intro');
    // We use a ref-like promise mechanism for the exit animation if needed, 
    // but for now simple state is enough to trigger effects.

    // We can track if intro has played in this session to avoid re-playing on reload/navigation
    // inside the component logic.

    return (
        <ClientAnimationContext.Provider
            value={{
                animationState,
                setAnimationState,
                startExitAnimation: async () => { }, // Placeholder, will be overriden by the Wrapper
                introPlayed: false
            }}
        >
            {children}
        </ClientAnimationContext.Provider>
    );
}

export const useClientAnimation = () => {
    const context = useContext(ClientAnimationContext);
    if (!context) {
        throw new Error('useClientAnimation must be used within a ClientAnimationProvider');
    }
    return context;
};

export { ClientAnimationContext };
