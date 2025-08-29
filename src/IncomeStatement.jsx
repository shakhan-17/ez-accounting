import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
import { Box, Container, Paper, Typography } from '@mui/material';

// Import MUI X components and dayjs
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateRangePicker } from '@mui/x-date-pickers-pro/DateRangePicker';
import dayjs from 'dayjs';

const IncomeStatement = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState([
    dayjs().startOf('year'), // Default start date: beginning of the current year
    dayjs(),                 // Default end date: today's date
  ]);

  useEffect(() => {
    const fetchTrialBalance = async () => {
      if (!user || !dateRange[0] || !dateRange[1]) {
        setLoading(false);
        return;
      }
      
      const startDate = dateRange[0].startOf('day').toISOString();
      const endDate = dateRange[1].endOf('day').toISOString();
      
      try {
        setLoading(true);
        // We'll use a Supabase RPC to call a function that generates the trial balance
        // for a specific date range. This is the most efficient way to do this.
        // Assuming you have a function called 'get_trial_balance_by_date'
        const { data, error } = await supabase.rpc('get_trial_balance_by_date', {
          start_date_param: startDate,
          end_date_param: endDate,
        });

        if (error) throw error;
        setAccounts(data || []);
      } catch (error) {
        console.error('Error fetching trial balance:', error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTrialBalance();
  }, [user, dateRange]); // Re-run the effect when dateRange changes

  // Process the trial balance data to calculate income statement figures
  const incomeStatementData = useMemo(() => {
    const revenues = accounts.filter(acc => acc.account_type === 'Revenue');
    const cogs = accounts.filter(acc => acc.account_type === 'Cost of Goods Sold');
    const expenses = accounts.filter(acc => acc.account_type === 'Expense');

    const totalRevenue = revenues.reduce((sum, acc) => sum + (Number(acc.ending_balance) || 0), 0);
    const totalCogs = cogs.reduce((sum, acc) => sum + (Number(acc.ending_balance) || 0), 0);
    const grossProfit = totalRevenue + totalCogs; // Cogs is a debit balance, so we add it as negative
    const totalExpenses = expenses.reduce((sum, acc) => sum + (Number(acc.ending_balance) || 0), 0);
    const netIncome = grossProfit + totalExpenses; // Expenses are debit balances, so we add them as negative

    return { revenues, cogs, expenses, totalRevenue, totalCogs, grossProfit, totalExpenses, netIncome };
  }, [accounts]);
  
  const renderAccountList = (accounts) => (
    <ul style={{ listStyle: 'none', paddingLeft: '20px' }}>
      {accounts.map(acc => (
        <li key={acc.account_id} style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{acc.account_code} - {acc.account_name}</span>
          <span>${(Math.abs(Number(acc.ending_balance))).toFixed(2)}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom component="h1">
        Income Statement
      </Typography>
      <Box sx={{ my: 2 }}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DateRangePicker
            label="Select Date Range"
            value={dateRange}
            onChange={(newRange) => {
              setDateRange(newRange);
            }}
          />
        </LocalizationProvider>
      </Box>
      <Paper sx={{ p: 2 }}>
        {loading ? (
          <p>Generating Income Statement...</p>
        ) : (
          <div>
            <p>For the Period Ended {dayjs(dateRange[1]).format('MMMM DD, YYYY')}</p>
            <div style={{ marginTop: '20px' }}>
              <h4>Revenues</h4>
              {renderAccountList(incomeStatementData.revenues)}
              <hr />
              <p style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>Total Revenue</strong>
                <strong>${incomeStatementData.totalRevenue.toFixed(2)}</strong>
              </p>
              
              <h4 style={{ marginTop: '20px' }}>Cost of Goods Sold</h4>
              {renderAccountList(incomeStatementData.cogs)}
              <hr />
              <p style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>Total Cost of Goods Sold</strong>
                <strong>${Math.abs(incomeStatementData.totalCogs).toFixed(2)}</strong>
              </p>
              <hr />
              <p style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1em' }}>
                Gross Profit
                <span>${incomeStatementData.grossProfit.toFixed(2)}</span>
              </p>
              
              <h4 style={{ marginTop: '20px' }}>Operating Expenses</h4>
              {renderAccountList(incomeStatementData.expenses)}
              <hr />
              <p style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>Total Operating Expenses</strong>
                <strong>${Math.abs(incomeStatementData.totalExpenses).toFixed(2)}</strong>
              </p>
              <hr />
              <div style={{ background: '#333', padding: '10px', borderRadius: '5px', marginTop: '10px' }}>
                <p style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2em', margin: 0 }}>
                  Net Income
                  <span>${incomeStatementData.netIncome.toFixed(2)}</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </Paper>
    </Container>
  );
};

export default IncomeStatement;