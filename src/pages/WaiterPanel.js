import React, { useState } from 'react';
import TableManagement from '../components/TableManagement';
import ProductSearch from '../components/ProductSearch';

const WaiterPanel = () => {
    const [selectedTable, setSelectedTable] = useState(null);

    return (
        <div>
            <h1>Waiter Panel</h1>
            <TableManagement />
            {selectedTable && <ProductSearch tableId={selectedTable} />}
        </div>
    );
};

export default WaiterPanel;
