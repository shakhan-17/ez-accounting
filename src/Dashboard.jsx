import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Grid, Paper, Card, CardContent } from '@mui/material';
import { supabase } from './supabaseClient'; // Import supabase client
import { useAuth } from './AuthContext';
import dayjs from 'dayjs';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    cashOnHand: 0,
    recentTransactions: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch financial data from journal_entries
        const { data: entries, error: entriesError } = await supabase
          .from('journal_entries')
          .select('debit, credit, account_id, transaction_date, description') // Corrected columns
          .eq('user_id', user.id);

        if (entriesError) throw entriesError;

        // Fetch all accounts to determine type (revenue vs expense)
        const { data: accounts, error: accountsError } = await supabase
          .from('chart_of_accounts') // Corrected table name
          .select('id, type');
        
        if (accountsError) throw accountsError;

        const accountTypes = accounts.reduce((acc, curr) => {
          acc[curr.id] = curr.type;
          return acc;
        }, {});

        let totalIncome = 0;
        let totalExpenses = 0;

        entries.forEach(entry => {
          const accountType = accountTypes[entry.account_id];
          if (accountType === 'Revenue') {
            totalIncome += entry.credit - entry.debit;
          } else if (accountType === 'Expense') {
            totalExpenses += entry.debit - entry.credit;
          }
        });

        // Fetch total cash from bank accounts
        const { data: bankAccounts, error: bankError } = await supabase
          .from('bank_accounts')
          .select('current_balance') // Corrected column name
          .eq('user_id', user.id);

        if (bankError) throw bankError;

        const cashOnHand = bankAccounts.reduce((sum, account) => sum + (Number(account.current_balance) || 0), 0);
        const netProfit = totalIncome - totalExpenses;

        // Fetch recent transactions (simplified for dashboard)
        const { data: recentEntries, error: recentError } = await supabase
          .from('journal_entries')
          .select('transaction_date, description, debit, credit, id')
          .order('transaction_date', { ascending: false })
          .limit(5);

        if (recentError) throw recentError;
        
        const recentTransactions = recentEntries.map(entry => ({
          id: entry.id,
          date: dayjs(entry.transaction_date).format('YYYY-MM-DD'),
          description: entry.description,
          amount: entry.debit > 0 ? entry.debit : entry.credit,
          type: entry.debit > 0 ? 'Expense' : 'Income', // Simplified
        }));

        setDashboardData({
          totalIncome,
          totalExpenses,
          netProfit,
          cashOnHand,
          recentTransactions,
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h5" align="center">
          Loading dashboard data...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom component="h1">
        Dashboard Overview
      </Typography>
      <Grid container spacing={3}>
        {/* Financial Summary Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Total Income
              </Typography>
              <Typography variant="h5" component="div">
                ${dashboardData.totalIncome.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Total Expenses
              </Typography>
              <Typography variant="h5" component="div">
                ${dashboardData.totalExpenses.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Net Profit
              </Typography>
              <Typography variant="h5" component="div">
                ${dashboardData.netProfit.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Cash on Hand
              </Typography>
              <Typography variant="h5" component="div">
                ${dashboardData.cashOnHand.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Transactions Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Transactions
            </Typography>
            <ul>
              {dashboardData.recentTransactions.map(transaction => (
                <li key={transaction.id}>
                  <Typography>
                    **{transaction.type}**: {transaction.description} - **${transaction.amount.toFixed(2)}** ({transaction.date})
                  </Typography>
                </li>
              ))}
            </ul>
          </Paper>
        </Grid>

        {/* Charts Section - to be implemented with recharts */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 300, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Income vs Expenses Chart
            </Typography>
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                (This is where your Recharts graph will go)
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 300, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Account Balances
            </Typography>
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                (This is where your account balance chart will go)
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};
export default Dashboard;