import { createContext, useContext, useState, useCallback } from 'react';

const ModalContext = createContext(null);

export function ModalProvider({ children }) {
  const [expenseModal, setExpenseModal] = useState({ open: false, groupId: null });
  const [refreshKey, setRefreshKey] = useState(0);

  const openAddExpense = useCallback((groupId = null) => {
    setExpenseModal({ open: true, groupId });
  }, []);
  const closeAddExpense = useCallback(() => setExpenseModal({ open: false, groupId: null }), []);
  const bumpRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <ModalContext.Provider value={{ expenseModal, openAddExpense, closeAddExpense, refreshKey, bumpRefresh }}>
      {children}
    </ModalContext.Provider>
  );
}

export const useModal = () => useContext(ModalContext);
