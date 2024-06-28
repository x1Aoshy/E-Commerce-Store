import React, { useState, useEffect } from 'react';
import { getTables, updateTableStatus, completeTable } from '../services/api';
import './TableManagement.css';

const TableManagement = ({ onSelectTable }) => {
    const [tables, setTables] = useState([]);

    useEffect(() => {
        fetchTables();
    }, []);

    const fetchTables = async () => {
        const data = await getTables();
        setTables(data);
    };

    const handleUpdateTableStatus = async (id, status) => {
        await updateTableStatus(id, status);
        fetchTables();
    };

    const handleCompleteTable = async (id) => {
        await completeTable(id);
        fetchTables();
    };

    return (
        <div>
            <h2>Table Management</h2>
            <ul className="table-list">
                {tables.map(table => (
                    <li key={table.id} onClick={() => onSelectTable(table.id)}>
                        Table {table.id} - {table.status}
                        {table.status === 'con_ordenes' && (
                            <button onClick={() => handleCompleteTable(table.id)}>Complete Table</button>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default TableManagement;
