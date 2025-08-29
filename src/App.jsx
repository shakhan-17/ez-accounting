import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useAuth } from './AuthContext';

// Import MUI Components
import { AppBar, Box, Button, Container, Toolbar, Typography, Menu, MenuItem } from '@mui/material';

// Import all page components
import Dashboard from './Dashboard';
import Setup from './Setup';
import UserProfile from './UserProfile';
import BusinessProfile from './BusinessProfile';
import UserEdit from './UserEdit';
import ChartOfAccounts from './ChartOfAccounts';
import Suppliers from './Suppliers';
import Customers from './Customers';
import CustomerCreate from './CustomerCreate';
import CustomerEdit from './CustomerEdit';
import ProductsAndServices from './ProductsAndServices';
import Inventory from './Inventory';
import Invoices from './Invoices';
import InvoiceCreate from './InvoiceCreate';
import InvoiceDetail from './InvoiceDetail';
import InvoiceEdit from './InvoiceEdit';
import Expenses from './Expenses';
import ExpenseCreate from './ExpenseCreate';
import ExpenseEdit from './ExpenseEdit';
import PurchaseOrders from './PurchaseOrders';
import PurchaseOrderCreate from './PurchaseOrderCreate';
import Bills from './Bills';
import BillCreate from './BillCreate';
import BillEdit from './BillEdit';
import BankAccounts from './BankAccounts';
import BankCreate from './BankCreate';
import BankAccountEdit from './BankAccountEdit';
import Payments from './Payments';
import PaymentCreate from './PaymentCreate';
import UserManagement from './UserManagement';
import BankReconciliation from './BankReconciliation';
import GeneralLedger from './GeneralLedger';
import TrialBalance from './TrialBalance';
import IncomeStatement from './IncomeStatement';
import BalanceSheet from './BalanceSheet';
import FixedAssets from './FixedAssets';
import Depreciation from './Depreciation';
import AccountEdit from './AccountEdit';
import SupplierEdit from './SupplierEdit';
import ProductEdit from './ProductEdit';
import FixedAssetEdit from './FixedAssetEdit';

const DashboardLayout = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [reportsAnchorEl, setReportsAnchorEl] = useState(null);
  const [accountingAnchorEl, setAccountingAnchorEl] = useState(null);
  const [assetsAnchorEl, setAssetsAnchorEl] = useState(null);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);

  const handleMenuClick = (setter) => (event) => setter(event.currentTarget);
  const handleMenuClose = (setter) => () => setter(null);

  useEffect(() => {
    if (!loading && profile && !profile.has_completed_setup && location.pathname !== '/setup') {
      navigate('/setup', { replace: true });
    }
  }, [profile, loading, navigate, location.pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" component={Link} to="/" sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none' }}>
            Ez Accounting
          </Typography>

          <Button component={Link} to="/" color="inherit">Dashboard</Button>
          <Button component={Link} to="/invoices" color="inherit">Invoices</Button>
          <Button component={Link} to="/bills" color="inherit">Bills</Button>
          <Button component={Link} to="/expenses" color="inherit">Expenses</Button>

          <Button color="inherit" onClick={handleMenuClick(setAccountingAnchorEl)}>Accounting</Button>
          <Menu anchorEl={accountingAnchorEl} open={Boolean(accountingAnchorEl)} onClose={handleMenuClose(setAccountingAnchorEl)}>
            <MenuItem component={Link} to="/inventory" onClick={handleMenuClose(setAccountingAnchorEl)}>Inventory</MenuItem>
            <MenuItem component={Link} to="/chart-of-accounts" onClick={handleMenuClose(setAccountingAnchorEl)}>Chart of Accounts</MenuItem>
            <MenuItem component={Link} to="/bank-accounts" onClick={handleMenuClose(setAccountingAnchorEl)}>Bank Accounts</MenuItem>
            <MenuItem component={Link} to="/customers" onClick={handleMenuClose(setAccountingAnchorEl)}>Customers</MenuItem>
            <MenuItem component={Link} to="/suppliers" onClick={handleMenuClose(setAccountingAnchorEl)}>Suppliers</MenuItem>
            <MenuItem component={Link} to="/products" onClick={handleMenuClose(setAccountingAnchorEl)}>Products & Services</MenuItem>
            <MenuItem component={Link} to="/payments" onClick={handleMenuClose(setAccountingAnchorEl)}>Payments</MenuItem>
            <MenuItem component={Link} to="/purchase-orders" onClick={handleMenuClose(setAccountingAnchorEl)}>Purchase Orders</MenuItem>
            <MenuItem component={Link} to="/purchase-orders/new" onClick={handleMenuClose(setAccountingAnchorEl)}>Create Purchase Order</MenuItem>
          </Menu>

          <Button color="inherit" onClick={handleMenuClick(setAssetsAnchorEl)}>Assets</Button>
          <Menu anchorEl={assetsAnchorEl} open={Boolean(assetsAnchorEl)} onClose={handleMenuClose(setAssetsAnchorEl)}>
            <MenuItem component={Link} to="/fixed-assets" onClick={handleMenuClose(setAssetsAnchorEl)}>Fixed Assets</MenuItem>
            <MenuItem component={Link} to="/depreciation" onClick={handleMenuClose(setAssetsAnchorEl)}>Depreciation</MenuItem>
          </Menu>

          <Button color="inherit" onClick={handleMenuClick(setReportsAnchorEl)}>Reports</Button>
          <Menu anchorEl={reportsAnchorEl} open={Boolean(reportsAnchorEl)} onClose={handleMenuClose(setReportsAnchorEl)}>
            <MenuItem component={Link} to="/general-ledger" onClick={handleMenuClose(setReportsAnchorEl)}>General Ledger</MenuItem>
            <MenuItem component={Link} to="/trial-balance" onClick={handleMenuClose(setReportsAnchorEl)}>Trial Balance</MenuItem>
            <MenuItem component={Link} to="/income-statement" onClick={handleMenuClose(setReportsAnchorEl)}>Income Statement</MenuItem>
            <MenuItem component={Link} to="/balance-sheet" onClick={handleMenuClose(setReportsAnchorEl)}>Balance Sheet</MenuItem>
          </Menu>

          <Button component={Link} to="/bank-reconciliation" color="inherit">Bank Reconciliation</Button>

          <Button color="inherit" onClick={handleMenuClick(setSettingsAnchorEl)}>{user?.email}</Button>
          <Menu anchorEl={settingsAnchorEl} open={Boolean(settingsAnchorEl)} onClose={handleMenuClose(setSettingsAnchorEl)}>
            <MenuItem component={Link} to="/profile" onClick={handleMenuClose(setSettingsAnchorEl)}>My Profile</MenuItem>
            <MenuItem component={Link} to="/business-profile" onClick={handleMenuClose(setSettingsAnchorEl)}>Business Profile</MenuItem>
            <MenuItem component={Link} to="/user-management" onClick={handleMenuClose(setSettingsAnchorEl)}>User Management</MenuItem>
            <MenuItem onClick={() => { handleMenuClose(setSettingsAnchorEl)(); handleSignOut(); }}>Sign Out</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, p: 3, marginTop: '64px' }}>
        <Outlet />
      </Box>
    </Box>
  );
};

const AuthComponent = () => (
  <Container component="main" maxWidth="xs" sx={{ mt: 8 }}>
    <Typography component="h1" variant="h5">Ez Accounting</Typography>
    <Typography component="p" sx={{ mt: 1 }}>Sign in or create an account to continue.</Typography>
    <Box sx={{ mt: 3 }}>
      <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} providers={['google', 'github']} />
    </Box>
  </Container>
);

function App() {
  const { session, loading } = useAuth();
  if (loading) {
    return <div>Loading Application...</div>;
  }
  return (
    <Routes>
      {!session ? (
        <Route path="/*" element={<AuthComponent />} />
      ) : (
        <>
          <Route path="/setup" element={<Setup />} />
          <Route path="/*" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="business-profile" element={<BusinessProfile />} />
            <Route path="user-management" element={<UserManagement />} />
            <Route path="user-management/edit/:userId" element={<UserEdit />} />
            <Route path="chart-of-accounts" element={<ChartOfAccounts />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/new" element={<CustomerCreate />} />
            <Route path="customers/edit/:customerId" element={<CustomerEdit />} />
            <Route path="products" element={<ProductsAndServices />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="invoices/new" element={<InvoiceCreate />} />
            <Route path="invoices/:invoiceId" element={<InvoiceDetail />} />
            <Route path="invoices/edit/:invoiceId" element={<InvoiceEdit />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="expenses/new" element={<ExpenseCreate />} />
            <Route path="expenses/edit/:expenseId" element={<ExpenseEdit />} />
            <Route path="purchase-orders" element={<PurchaseOrders />} />
            <Route path="purchase-orders/new" element={<PurchaseOrderCreate />} />
            <Route path="bills" element={<Bills />} />
            <Route path="bills/new" element={<BillCreate />} />
            <Route path="bills/edit/:billId" element={<BillEdit />} />
            <Route path="bank-accounts" element={<BankAccounts />} />
            <Route path="bank-accounts/new" element={<BankCreate />} />
            <Route path="bank-accounts/edit/:accountId" element={<BankAccountEdit />} />
            <Route path="payments" element={<Payments />} />
            <Route path="payments/new" element={<PaymentCreate />} />
            <Route path="accounts/edit/:accountId" element={<AccountEdit />} />
            <Route path="suppliers/edit/:supplierId" element={<SupplierEdit />} />
            <Route path="products/edit/:productId" element={<ProductEdit />} />
            <Route path="general-ledger" element={<GeneralLedger />} />
            <Route path="trial-balance" element={<TrialBalance />} />
            <Route path="income-statement" element={<IncomeStatement />} />
            <Route path="balance-sheet" element={<BalanceSheet />} />
            <Route path="fixed-assets" element={<FixedAssets />} />
            <Route path="fixed-assets/edit/:assetId" element={<FixedAssetEdit />} />
            <Route path="depreciation" element={<Depreciation />} />
            <Route path="bank-reconciliation" element={<BankReconciliation />} />
          </Route>
        </>
      )}
    </Routes>
  );
}
export default App;