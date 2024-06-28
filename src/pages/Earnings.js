import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Table } from 'react-bootstrap';

const Earnings = () => {
  const [earnings, setEarnings] = useState([]);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const response = await api.get('/earnings');
      setEarnings(response.data);
    } catch (error) {
      console.error('Error fetching earnings:', error);
    }
  };

  return (
    <div className="earnings container">
      <h1>Ganancias Mensuales</h1>
      <Table striped bordered hover className="mt-3">
        <thead>
          <tr>
            <th>ID</th>
            <th>Mes</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {earnings.map((earning) => (
            <tr key={earning.id}>
              <td>{earning.id}</td>
              <td>{earning.month}</td>
              <td>{earning.total}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default Earnings;
