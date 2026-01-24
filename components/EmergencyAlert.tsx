import React from 'react';

interface EmergencyAlertProps {
    onDismiss: () => void;
}

export const EmergencyAlert: React.FC<EmergencyAlertProps> = ({ onDismiss }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md mx-4 shadow-2xl border-2 border-red-500">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-2xl">warning</span>
                        </div>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">
                            Emergency Situation Detected
                        </h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                            If you're experiencing a medical emergency, please call emergency services (911 in the US) immediately. 
                            This assistant cannot provide emergency medical care.
                        </p>
                        <div className="flex gap-2">
                            <a
                                href="tel:911"
                                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-center font-semibold hover:bg-red-700 transition-colors"
                            >
                                Call 911
                            </a>
                            <button
                                onClick={onDismiss}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
