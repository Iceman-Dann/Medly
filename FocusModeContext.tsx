import React, { createContext, useContext, useState, useEffect } from 'react';

export type FocusModeId = 'menstrual' | 'fertility' | 'post_partum' | 'perimenopause' | null;

const FOCUS_MODE_STORAGE_KEY = 'symra_focus_mode';

interface FocusModeContextType {
    focusMode: FocusModeId;
    setFocusMode: (mode: FocusModeId) => void;
    clearFocusMode: () => void;
    getFocusModeLabel: (modeId: FocusModeId) => string;
}

const FocusModeContext = createContext<FocusModeContextType | undefined>(undefined);

const VALID_MODE_IDS: FocusModeId[] = ['menstrual', 'fertility', 'post_partum', 'perimenopause'];

const MODE_LABELS: Record<NonNullable<FocusModeId>, string> = {
    menstrual: 'Menstrual Health',
    fertility: 'Fertility',
    post_partum: 'Post-Partum Recovery',
    perimenopause: 'Perimenopause',
};

export const FocusModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [focusMode, setFocusModeState] = useState<FocusModeId>(null);
    const [isHydrated, setIsHydrated] = useState(false);

    // Load from localStorage on mount (client-side only)
    useEffect(() => {
        try {
            const stored = localStorage.getItem(FOCUS_MODE_STORAGE_KEY);
            if (stored) {
                const parsed = stored as FocusModeId;
                // Validate stored value - ignore unknown values
                if (VALID_MODE_IDS.includes(parsed)) {
                    setFocusModeState(parsed);
                } else {
                    // Invalid value, clear it
                    localStorage.removeItem(FOCUS_MODE_STORAGE_KEY);
                }
            }
        } catch (error) {
            console.error('Failed to load focus mode from localStorage:', error);
        } finally {
            setIsHydrated(true);
        }
    }, []);

    const setFocusMode = (mode: FocusModeId) => {
        // Validate mode before setting
        if (mode !== null && !VALID_MODE_IDS.includes(mode)) {
            console.warn(`Invalid focus mode: ${mode}. Ignoring.`);
            return;
        }

        setFocusModeState(mode);
        try {
            if (mode === null) {
                localStorage.removeItem(FOCUS_MODE_STORAGE_KEY);
            } else {
                localStorage.setItem(FOCUS_MODE_STORAGE_KEY, mode);
            }
        } catch (error) {
            console.error('Failed to save focus mode to localStorage:', error);
        }
    };

    const clearFocusMode = () => {
        setFocusMode(null);
    };

    const getFocusModeLabel = (modeId: FocusModeId): string => {
        if (!modeId) return 'None';
        return MODE_LABELS[modeId] || 'Unknown';
    };

    return (
        <FocusModeContext.Provider
            value={{
                focusMode: isHydrated ? focusMode : null, // Return null during SSR/hydration to avoid mismatch
                setFocusMode,
                clearFocusMode,
                getFocusModeLabel,
            }}
        >
            {children}
        </FocusModeContext.Provider>
    );
};

export const useFocusMode = () => {
    const context = useContext(FocusModeContext);
    if (!context) {
        throw new Error('useFocusMode must be used within a FocusModeProvider');
    }
    return context;
};
