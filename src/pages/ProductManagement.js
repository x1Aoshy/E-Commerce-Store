import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Table, Button, Form, InputGroup } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaBars } from 'react-icons/fa';
import Swal from 'sweetalert2';
import Modal from 'react-modal';
import Sidebar from '../components/Sidebar';
import '../styles/global.css';

Modal.setAppElement('#root'); // Configuración necesaria para accesibilidad

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [show, setShow] = useState(false);
  const [currentProduct, setCurrentProduct] = useState({ name: '', description: '', price: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
      setFilteredProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleShow = (product) => {
    if (product) {
      setCurrentProduct(product);
      setIsEditing(true);
    } else {
      setCurrentProduct({ name: '', description: '', price: '' });
      setIsEditing(false);
    }
    setShow(true);
  };

  const handleClose = () => setShow(false);

  const handleChange = (e) => {
    setCurrentProduct({ ...currentProduct, [e.target.name]: e.target.value });
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(value.toLowerCase()) ||
      product.description.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredProducts(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.put(`/products/${currentProduct.id}`, currentProduct);
        Swal.fire('Producto actualizado', 'El producto ha sido actualizado exitosamente', 'success');
      } else {
        await api.post('/products', currentProduct);
        Swal.fire('Producto creado', 'El producto ha sido creado exitosamente', 'success');
      }
      fetchProducts();
      handleClose();
    } catch (error) {
      console.error('Error saving product:', error);
      Swal.fire('Error', 'Hubo un problema al guardar el producto', 'error');
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "¡No podrás revertir esto!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminarlo'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/products/${id}`);
          Swal.fire('Producto eliminado', 'El producto ha sido eliminado exitosamente', 'success');
          fetchProducts();
        } catch (error) {
          console.error('Error deleting product:', error);
          Swal.fire('Error', 'Hubo un problema al eliminar el producto', 'error');
        }
      }
    });
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="d-flex">
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <Sidebar />
      </div>
      <div className="admin-content">
        <Button className="sidebar-toggle" onClick={toggleSidebar}>
          <FaBars />
        </Button>
        <div className="product-management container">
          <InputGroup className="mb-3">
            <Form.Control
              type="text"
              className="search-input"
              placeholder="Buscar producto..."
              value={search}
              onChange={handleSearch}
            />
          </InputGroup>
          <Button variant="primary" className="mb-3 button-primary" onClick={() => handleShow(null)}>
            <FaPlus /> Agregar Producto
          </Button>
          <Table striped bordered hover className="mt-3">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Precio C$</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td>{product.name}</td>
                  <td>{product.description}</td>
                  <td>{product.price}</td>
                  <td>
                    <Button variant="warning" className="mr-2 button-warning" onClick={() => handleShow(product)}>
                      <FaEdit /> Editar
                    </Button>
                    <Button variant="danger" className="button-danger" onClick={() => handleDelete(product.id)}>
                      <FaTrash /> Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <Modal
            isOpen={show}
            onRequestClose={handleClose}
            contentLabel={isEditing ? 'Editar Producto' : 'Agregar Producto'}
            className="modal-content"
            overlayClassName="modal-overlay"
          >
            <h2 className="modal-title">{isEditing ? 'Editar Producto' : 'Agregar Producto'}</h2>
            <Form onSubmit={handleSubmit}>
              <Form.Group controlId="formProductName">
                <Form.Label>Nombre</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    name="name"
                    value={currentProduct.name}
                    onChange={handleChange}
                    required
                  />
                </InputGroup>
              </Form.Group>
              <Form.Group controlId="formProductDescription" className="mt-3">
                <Form.Label>Descripción</Form.Label>
                <InputGroup>
                  <Form.Control
                    as="textarea"
                    name="description"
                    value={currentProduct.description}
                    onChange={handleChange}
                  />
                </InputGroup>
              </Form.Group>
              <Form.Group controlId="formProductPrice" className="mt-3">
                <Form.Label>Precio</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="number"
                    name="price"
                    value={currentProduct.price}
                    onChange={handleChange}
                    required
                  />
                </InputGroup>
              </Form.Group>
              <Button variant="primary" type="submit" className="mt-3 button-primary">
                {isEditing ? 'Actualizar' : 'Guardar'}
              </Button>
            </Form>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default ProductManagement;
