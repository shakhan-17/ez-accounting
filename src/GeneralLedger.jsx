import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
import { Box, Container, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Autocomplete, TextField } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const GeneralLedger = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(dayjs().startOf('year'));
  const [endDate, setEndDate] = useState(dayjs());

  useEffect(() => {
    const fetchAccounts = async () => {
      const { data, error } = await supabase.from('chart_of_accounts').select('id, name, code');
      if (error) {
        console.error('Error fetching accounts:', error);
      } else {
        setAccounts(data || []);
      }
    };
    fetchAccounts();
  }, []);

  useEffect(() => {
    const fetchGeneralLedger = async () => {
      if (!user || !startDate || !endDate) {
        setLoading(false);
        return;
      }
      
      const startIsoDate = startDate.startOf('day').toISOString();
      const endIsoDate = endDate.endOf('day').toISOString();
      
      try {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_general_ledger_by_date', {
          start_date_param: startIsoDate,
          end_date_param: endIsoDate,
          account_id_param: selectedAccount ? selectedAccount.id : null,
        });

        if (error) throw error;
        setTransactions(data || []);
      } catch (error) {
        console.error('Error fetching general ledger:', error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchGeneralLedger();
  }, [user, startDate, endDate, selectedAccount]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom component="h1">
        General Ledger
      </Typography>
      <Box sx={{ my: 2, display: 'flex', gap: 2 }}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={(newValue) => setStartDate(newValue)}
          />
        </LocalizationProvider>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={(newValue) => setEndDate(newValue)}
          />
        </LocalizationProvider>
        <Autocomplete
          disablePortal
          id="account-select"
          options={accounts}
          getOptionLabel={(option) => `${option.code} - ${option.name}`}
          value={selectedAccount}
          onChange={(event, newValue) => {
            setSelectedAccount(newValue);
          }}
          sx={{ width: 300 }}
          renderInput={(params) => <TextField {...params} label="Select Account (All)" />}
        />
      </Box>
      <Paper sx={{ p: 2 }}>
        {loading ? (
          <p>Generating General Ledger...</p>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Account</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Debit</TableCell>
                  <TableCell align="right">Credit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{dayjs(row.transaction_date).format('YYYY-MM-DD')}</TableCell>
                    <TableCell>{row.account_name}</TableCell>
                    <TableCell>{row.description}</TableCell>
                    <TableCell align="right">${row.debit.toFixed(2)}</TableCell>
                    <TableCell align="right">${row.credit.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Container>
  );
};

export default GeneralLedger;