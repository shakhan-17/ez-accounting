import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';

// Import MUI components for styling
import {
  Box,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';

const Inventory = () => {
  const { user } = useAuth();
  const [inventoryItems, setInventoryItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for the form to add a new inventory item
  const [newItem, setNewItem] = useState({
    product_id: '',
    initial_stock: '',
    unit_cost: ''
  });

  useEffect(() => {
    if (user) {
      fetchInventoryAndProducts();
    }
  }, [user]);

  const fetchInventoryAndProducts = async () => {
    setLoading(true);
    try {
      // Fetch all products to populate the dropdown
      const { data: productsData, error: productsError } = await supabase
        .from('products_and_services')
        .select('id, name');
      if (productsError) throw productsError;
      setProducts(productsData);

      // Fetch all inventory items, joining with the products table
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory_items')
        .select(`
          id,
          created_at,
          initial_stock,
          current_stock,
          unit_cost,
          product:product_id(name)
        `);
      if (inventoryError) throw inventoryError;
      setInventoryItems(inventoryData);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setNewItem({ ...newItem, [name]: value });
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.product_id || !newItem.initial_stock || !newItem.unit_cost) {
      alert('Please fill out all fields.');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory_items')
        .insert([
          {
            ...newItem,
            user_id: user.id,
            current_stock: newItem.initial_stock
          }
        ]);

      if (error) throw error;
      
      alert('Inventory item added successfully!');
      setNewItem({ product_id: '', initial_stock: '', unit_cost: '' });
      fetchInventoryAndProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Typography color="error">Error: {error}</Typography>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Inventory Management
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Add New Inventory Item</Typography>
        <form onSubmit={handleAddItem}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel id="product-select-label">Product</InputLabel>
              <Select
                labelId="product-select-label"
                name="product_id"
                value={newItem.product_id}
                onChange={handleFormChange}
                label="Product"
              >
                {products.map(product => (
                  <MenuItem key={product.id} value={product.id}>
                    {product.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Initial Stock"
              name="initial_stock"
              type="number"
              value={newItem.initial_stock}
              onChange={handleFormChange}
              required
            />
            <TextField
              label="Unit Cost"
              name="unit_cost"
              type="number"
              value={newItem.unit_cost}
              onChange={handleFormChange}
              required
            />
            <Button variant="contained" type="submit">
              Add Item
            </Button>
          </Box>
        </form>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product Name</TableCell>
              <TableCell>Initial Stock</TableCell>
              <TableCell>Current Stock</TableCell>
              <TableCell>Unit Cost</TableCell>
              <TableCell>Created At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inventoryItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.product.name}</TableCell>
                <TableCell>{item.initial_stock}</TableCell>
                <TableCell>{item.current_stock}</TableCell>
                <TableCell>${item.unit_cost}</TableCell>
                <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default Inventory;