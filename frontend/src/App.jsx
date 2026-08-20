import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AIChatProvider } from './context/AIChatContext';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Accounts } from './pages/Accounts';
import { CreditCards } from './pages/CreditCards';
import { Transactions } from './pages/Transactions';
import { Settings } from './pages/Settings';

export function App() {
  return (
    <Router>
      <AIChatProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/credit-cards" element={<CreditCards />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </AIChatProvider>
    </Router>
  );
}

export default App;
