import React, { useState } from 'react';
import { searchProducts, createOrder } from '../services/api';
import './ProductSearch.css';

const ProductSearch = ({ tableId }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [products, setProducts] = useState([]);
    const [quantity, setQuantity] = useState(1);

    const handleSearch = async () => {
        const data = await searchProducts(searchTerm);
        setProducts(data);
    };

    const handleAddOrder = async (product_name) => {
        await createOrder(tableId, product_name, quantity);
    };

    return (
        <div>
            <h2>Product Search</h2>
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for products"
            />
            <button onClick={handleSearch}>Search</button>
            <ul className="product-list">
                {products.map(product => (
                    <li key={product.name}>
                        {product.name}
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            min="1"
                        />
                        <button onClick={() => handleAddOrder(product.name)}>Add to Table</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ProductSearch;
