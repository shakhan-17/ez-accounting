import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
import { Box, Container, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateRangePicker } from '@mui/x-date-pickers-pro/DateRangePicker';
import dayjs from 'dayjs';

const BalanceSheet = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(dayjs().startOf('year'));
  const [endDate, setEndDate] = useState(dayjs());

  useEffect(() => {
    const fetchBalanceSheet = async () => {
      if (!user || !endDate) {
        setLoading(false);
        return;
      }
      
      const endIsoDate = endDate.endOf('day').toISOString();
      
      try {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_trial_balance_by_date', {
          start_date_param: dayjs('1970-01-01').toISOString(),
          end_date_param: endIsoDate,
        });

        if (error) throw error;
        setAccounts(data || []);
      } catch (error) {
        console.error('Error fetching balance sheet data:', error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBalanceSheet();
  }, [user, endDate]);

  const balanceSheetData = useMemo(() => {
    const assets = accounts.filter(acc => acc.account_type === 'Asset');
    const liabilities = accounts.filter(acc => acc.account_type === 'Liability');
    const equity = accounts.filter(acc => acc.account_type === 'Equity');

    const totalAssets = assets.reduce((sum, acc) => sum + (Number(acc.ending_balance) || 0), 0);
    const totalLiabilities = liabilities.reduce((sum, acc) => sum + (Number(acc.ending_balance) || 0), 0);
    const totalEquity = equity.reduce((sum, acc) => sum + (Number(acc.ending_balance) || 0), 0);
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    return { assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity, totalLiabilitiesAndEquity };
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
        Balance Sheet
      </Typography>
      <Box sx={{ my: 2 }}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DateRangePicker
            label="Select Date Range"
            value={[null, endDate]}
            onChange={(newRange) => {
              setEndDate(newRange[1]);
            }}
          />
        </LocalizationProvider>
      </Box>
      <Paper sx={{ p: 2 }}>
        {loading ? (
          <p>Generating Balance Sheet...</p>
        ) : (
          <div>
            <p>As of {dayjs(endDate).format('MMMM DD, YYYY')}</p>
            <div style={{ marginTop: '20px' }}>
              <h4>Assets</h4>
              {renderAccountList(balanceSheetData.assets)}
              <hr />
              <p style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>Total Assets</strong>
                <strong>${balanceSheetData.totalAssets.toFixed(2)}</strong>
              </p>

              <h4 style={{ marginTop: '20px' }}>Liabilities</h4>
              {renderAccountList(balanceSheetData.liabilities)}
              <hr />
              <p style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>Total Liabilities</strong>
                <strong>${Math.abs(balanceSheetData.totalLiabilities).toFixed(2)}</strong>
              </p>

              <h4 style={{ marginTop: '20px' }}>Equity</h4>
              {renderAccountList(balanceSheetData.equity)}
              <hr />
              <p style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>Total Equity</strong>
                <strong>${Math.abs(balanceSheetData.totalEquity).toFixed(2)}</strong>
              </p>
              <hr />
              <p style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1em' }}>
                Total Liabilities & Equity
                <span>${Math.abs(balanceSheetData.totalLiabilitiesAndEquity).toFixed(2)}</span>
              </p>
            </div>
          </div>
        )}
      </Paper>
    </Container>
  );
};

export default BalanceSheet;