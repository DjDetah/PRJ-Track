import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { clientiService, type Cliente } from '../services/clientiService';

interface ClientContextType {
    availableClienti: Cliente[];
    activeCliente: Cliente | null;
    setActiveCliente: (cliente: Cliente) => void;
    isLoadingClienti: boolean;
    refreshClienti: () => Promise<void>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: ReactNode }) {
    const { user, loading: authLoading } = useAuth();
    const [availableClienti, setAvailableClienti] = useState<Cliente[]>([]);
    const [activeCliente, setActiveCliente] = useState<Cliente | null>(null);
    const [isLoadingClienti, setIsLoadingClienti] = useState(true);

    const loadClienti = async () => {
        if (!user) {
            setAvailableClienti([]);
            setActiveCliente(null);
            setIsLoadingClienti(false);
            return;
        }

        setIsLoadingClienti(true);
        try {
            const clienti = await clientiService.getClientiForUser(user.id);
            setAvailableClienti(clienti);

            // If there's an active client saved in localStorage and it is still valid, use it
            const savedClientId = localStorage.getItem('ept_active_client_id');
            const validSavedClient = savedClientId ? clienti.find(c => c.id === savedClientId) : null;

            if (validSavedClient) {
                setActiveCliente(validSavedClient);
            } else if (clienti.length === 1) {
                // If only one client, auto select it
                setActiveCliente(clienti[0]);
                localStorage.setItem('ept_active_client_id', clienti[0].id);
            } else {
                setActiveCliente(null); // Must be selected explicitly if length > 1
            }
        } catch (error) {
            console.error("Failed to load clienti for user context:", error);
            setAvailableClienti([]);
            setActiveCliente(null);
        } finally {
            setIsLoadingClienti(false);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            loadClienti();
        }
    }, [user, authLoading]);

    const handleSetActiveCliente = (cliente: Cliente) => {
        setActiveCliente(cliente);
        localStorage.setItem('ept_active_client_id', cliente.id);
    };

    const value = {
        availableClienti,
        activeCliente,
        setActiveCliente: handleSetActiveCliente,
        isLoadingClienti,
        refreshClienti: loadClienti
    };

    return (
        <ClientContext.Provider value={value}>
            {children}
        </ClientContext.Provider>
    );
}

export function useClient() {
    const context = useContext(ClientContext);
    if (context === undefined) {
        throw new Error('useClient must be used within a ClientProvider');
    }
    return context;
}
