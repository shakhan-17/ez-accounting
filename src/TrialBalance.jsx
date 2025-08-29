import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
import { Box, Container, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateRangePicker } from '@mui/x-date-pickers-pro/DateRangePicker';
import dayjs from 'dayjs';

const TrialBalance = () => {
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
  }, [user, dateRange]);

  const totalDebits = accounts.reduce((sum, acc) => {
    return sum + (acc.ending_balance > 0 ? Number(acc.ending_balance) : 0);
  }, 0);

  const totalCredits = accounts.reduce((sum, acc) => {
    return sum + (acc.ending_balance < 0 ? Math.abs(Number(acc.ending_balance)) : 0);
  }, 0);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom component="h1">
        Trial Balance
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
          <p>Generating Trial Balance...</p>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Account</TableCell>
                  <TableCell>Account Type</TableCell>
                  <TableCell align="right">Debit</TableCell>
                  <TableCell align="right">Credit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {accounts.map((row) => (
                  <TableRow key={row.account_id}>
                    <TableCell>{row.account_code} - {row.account_name}</TableCell>
                    <TableCell>{row.account_type}</TableCell>
                    <TableCell align="right">
                      {row.ending_balance > 0 ? `$${row.ending_balance.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell align="right">
                      {row.ending_balance < 0 ? `$${Math.abs(row.ending_balance).toFixed(2)}` : '-'}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ '& td, & th': { border: 0 } }}>
                  <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>Total</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>${totalDebits.toFixed(2)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>${totalCredits.toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Container>
  );
};

export default TrialBalance;