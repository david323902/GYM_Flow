import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Asegúrate de tener axios instalado o usa tu instancia configurada
import { planesAPI } from '../../api/planes';

const VentanaPlanes = ({ isOpen, onClose }) => {
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newPlan, setNewPlan] = useState({
    nombre: '',
    precio: '',
    duracionDias: 30,
    tipo: 'mensual',
    entradas: 10,
    color: '#4F46E5',
  });
  const navigate = useNavigate();
  const [notification, setNotification] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'precio', direction: 'asc' });

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Función para formatear precio con puntos
  const formatCurrencyInput = (value) => {
    // Eliminar todo lo que no sea número
    const number = value.replace(/\D/g, '');
    // Formatear con puntos
    return new Intl.NumberFormat('es-CO').format(number);
  };

  const parseCurrencyInput = (value) => value.replace(/\./g, '');

  useEffect(() => {
    if (isOpen) {
      cargarPlanes();
    }
  }, [isOpen]);

  const cargarPlanes = async () => {
    try {
      setLoading(true);
      // Consumimos el endpoint que preparamos para ver TODOS los planes (activos e inactivos)
      // Ajusta la URL si tu backend está en otro puerto
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/planes?todos=true', {
        headers: {
            // Si usas autenticación, asegúrate de enviar el token aquí
            Authorization: token ? `Bearer ${token}` : ''
        }
      });
      
      if (response.data.success) {
        setPlanes(response.data.data);
      }
    } catch (error) {
      console.error("Error cargando planes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (plan) => {
    setEditingId(plan._id);
    setEditPrice(formatCurrencyInput(plan.precio.toString()));
  };

  const handleSaveClick = async (id) => {
    try {
      const precioNumerico = Number(parseCurrencyInput(editPrice));

      if (precioNumerico <= 0) {
        showNotification('error', 'El precio debe ser mayor a 0');
        return;
      }

      await planesAPI.update(id, { precio: precioNumerico });
      setEditingId(null);
      showNotification('success', 'Precio actualizado correctamente');
      cargarPlanes(); // Recargar la lista
    } catch (error) {
      console.error("Error actualizando precio:", error);
      showNotification('error', "Error al actualizar el precio");
    }
  };

  const handleCreateClick = () => {
    setIsCreating(true);
    setNewPlan({ nombre: '', precio: '', duracionDias: 30, tipo: 'mensual', entradas: 10, color: '#4F46E5' });
  };
  const handleSaveNewPlan = async () => {
    try {
      const precioRaw = parseCurrencyInput(newPlan.precio);

      if (!newPlan.nombre || !precioRaw) {
        showNotification('error', 'Nombre y precio son requeridos');
        return;
      }
      
      if (Number(precioRaw) <= 0) {
        showNotification('error', 'El precio debe ser mayor a 0');
        return;
      }

      // Validar si el nombre ya existe (insensible a mayúsculas/minúsculas)
      const nombreExiste = planes.some(p => p.nombre.trim().toLowerCase() === newPlan.nombre.trim().toLowerCase());
      if (nombreExiste) {
        showNotification('error', 'Ya existe un plan con ese nombre');
        return;
      }

      const payload = {
        nombre: newPlan.nombre,
        precio: Number(precioRaw),
        tipo: newPlan.tipo,
        descripcion: 'Creado desde dashboard',
        color: newPlan.color
      };

      if (newPlan.tipo === 'tiquetera') {
        payload.cantidad_entradas = Number(newPlan.entradas);
        payload.duracionDias = Number(newPlan.duracionDias);
      }
      await planesAPI.create(payload);
      
      setIsCreating(false);
      showNotification('success', 'Plan creado exitosamente');
      cargarPlanes();
    } catch (error) {
      console.error("Error creando plan:", error);
      showNotification('error', "Error al crear el plan");
    }
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este plan?')) return;
    
    try {
      await planesAPI.delete(id);
      showNotification('success', 'Plan eliminado correctamente');
      cargarPlanes();
    } catch (error) {
      console.error("Error eliminando plan:", error);
      const msg = error.response?.data?.message || "Error al eliminar el plan";
      showNotification('error', msg);
    }
  };

  const handleUsersClick = (planId) => {
    onClose();
    navigate('/clientes', { state: { planId } });
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedPlanes = useMemo(() => {
    let sortableItems = [...planes];
    sortableItems.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sortableItems;
  }, [planes, sortConfig]);

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {notification && (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: notification.type === 'success' ? '#10B981' : '#EF4444',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 100,
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <span>{notification.type === 'success' ? '✅' : '⚠️'}</span>
            {notification.message}
          </div>
        )}
        <div style={styles.header}>
          <h2 style={{margin: 0, color: '#4F46E5'}}>📋 Gestión de Planes</h2>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <button onClick={handleCreateClick} style={styles.btnPrimary}>+ Nuevo Plan</button>
            <button onClick={onClose} style={styles.closeBtn}>&times;</button>
          </div>
        </div>

        <div style={styles.content}>
          {loading ? (
            <p style={{textAlign: 'center', padding: '20px'}}>Cargando planes...</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr style={{backgroundColor: '#f9fafb'}}>
                  <th style={styles.th}>Nombre</th>
                  <th style={{...styles.th, cursor: 'pointer', userSelect: 'none'}} onClick={() => handleSort('precio')} title="Ordenar por precio">
                    Precio {sortConfig.key === 'precio' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                  </th>
                  <th style={styles.th}>Duración</th>
                  <th style={{...styles.th, cursor: 'pointer', userSelect: 'none'}} onClick={() => handleSort('usuariosActivos')} title="Ordenar por cantidad de usuarios">
                    Usuarios Activos {sortConfig.key === 'usuariosActivos' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                  </th>
                  <th style={styles.th}>Color</th>
                  <th style={styles.th}>Tipo</th>
                  <th style={styles.th}>Estado</th>
                  <th style={styles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isCreating && (
                  <tr style={{backgroundColor: '#f0f9ff', borderBottom: '1px solid #eee'}}>
                    <td style={styles.td}>
                      <input 
                        type="text" 
                        placeholder="Nombre Plan"
                        value={newPlan.nombre}
                        onChange={(e) => setNewPlan({...newPlan, nombre: e.target.value})}
                        style={{...styles.input, width: '100%'}}
                        autoFocus
                      />
                    </td>
                    <td style={styles.td}>
                      <input 
                        type="text" 
                        placeholder="$$"
                        value={newPlan.precio}
                        onChange={(e) => {
                          const formatted = formatCurrencyInput(e.target.value);
                          setNewPlan({...newPlan, precio: formatted});
                        }}
                        style={{...styles.input, width: '80px'}}
                      />
                    </td>
                    <td style={styles.td}>
                      {newPlan.tipo === 'Tiquetera' ? (
                         <div style={{display: 'flex', alignItems: 'center', gap: '2px'}}>
                           <input 
                            type="number"
                            value={newPlan.entradas}
                            onChange={(e) => setNewPlan({...newPlan, entradas: e.target.value})}
                            style={{...styles.input, width: '50px'}}
                           />
                          <span style={{fontSize: '10px'}}>Entr.</span>
                         </div>
                       ) : (
                        <div style={{display: 'flex', alignItems: 'center', gap: '2px'}}>
                          <input 
                            type="number" 
                            value={newPlan.duracionDias}
                            onChange={(e) => setNewPlan({...newPlan, duracionDias: e.target.value})}
                            style={{...styles.input, width: '50px'}}
                          />
                          <span style={{fontSize: '10px'}}>Días</span>
                        </div>
                       )}
                    </td>
                    <td style={styles.td}><span style={{fontSize: '12px', color: '#999'}}>-</span></td>
                    <td style={styles.td}>
                      <input 
                        type="color" 
                        value={newPlan.color}
                        onChange={(e) => setNewPlan({...newPlan, color: e.target.value})}
                        style={{...styles.input, width: '40px', padding: '2px', height: '30px', cursor: 'pointer'}}
                      />
                    </td>
                    <td style={styles.td}>
                      <select 
                        value={newPlan.tipo}
                        onChange={(e) => setNewPlan({...newPlan, tipo: e.target.value})}
                        style={styles.select}
                      >
                        <option value="mensual">Mensual</option>
                        <option value="tiquetera">Tiquetera</option>
                      </select>
                    </td>
                    <td style={styles.td}><span style={{fontSize: '12px', color: '#999'}}>Nuevo</span></td>
                    <td style={styles.td}>
                      <div style={{display: 'flex', gap: '5px'}}>
                        <button onClick={handleSaveNewPlan} style={styles.btnIcon} title="Guardar">💾</button>
                        <button onClick={() => setIsCreating(false)} style={styles.btnIcon} title="Cancelar">❌</button>
                      </div>
                    </td>
                  </tr>
                )}
                {sortedPlanes.map(plan => (
                  <tr key={plan._id} style={{borderBottom: '1px solid #eee'}}>
                    <td style={styles.td}><strong>{plan.nombre}</strong></td>
                    <td style={styles.td}>
                      {editingId === plan._id ? (
                        <input 
                          type="text" 
                          value={editPrice} 
                          onChange={(e) => {
                            const formatted = formatCurrencyInput(e.target.value);
                            setEditPrice(formatted);
                          }}
                          style={styles.input}
                        />
                      ) : (
                        `$${plan.precio.toLocaleString()}`
                      )}
                    </td>
                    <td style={styles.td}>
                      {plan.tipo === 'Tiquetera' || plan.tipo === 'tiquetera' ? `${plan.cantidad_entradas || plan.entradas || 0} Entradas` : `${plan.duracionDias} días`}
                    </td>
                    <td style={{...styles.td, textAlign: 'center'}}>
                      <span style={{
                        backgroundColor: '#EEF2FF', color: '#4F46E5', cursor: 'pointer',
                        padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold', fontSize: '12px',
                        textDecoration: 'underline'
                      }} onClick={() => handleUsersClick(plan._id)} title="Ver clientes de este plan">
                        {plan.usuariosActivos || 0}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={{
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '50%', 
                        backgroundColor: plan.color || '#4F46E5',
                        border: '1px solid #ddd'
                      }} title={plan.color}></div>
                    </td>
                    <td style={{...styles.td, textTransform: 'capitalize'}}>{plan.tipo}</td>
                    <td style={styles.td}>
                      <span style={{
                        padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                        backgroundColor: plan.activo ? '#DEF7EC' : '#FDE8E8',
                        color: plan.activo ? '#03543F' : '#9B1C1C'
                      }}>
                        {plan.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {editingId === plan._id ? (
                        <div style={{display: 'flex', gap: '5px'}}>
                          <button onClick={() => handleSaveClick(plan._id)} style={styles.btnIcon} title="Guardar">💾</button>
                          <button onClick={() => setEditingId(null)} style={styles.btnIcon} title="Cancelar">❌</button>
                        </div>
                      ) : (
                        <div style={{display: 'flex', gap: '5px'}}>
                          <button onClick={() => handleEditClick(plan)} style={styles.btnIcon} title="Editar Precio">✏️</button>
                          <button onClick={() => handleDeleteClick(plan._id)} style={styles.btnIcon} title="Eliminar Plan">🗑️</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        <div style={styles.footer}>
          <button onClick={onClose} style={styles.btnCerrar}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

// Estilos simples en línea para que funcione sin configurar CSS extra
const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
  },
  modal: {
    backgroundColor: 'white', borderRadius: '10px', width: '90%', maxWidth: '800px', maxHeight: '90vh', 
    display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    position: 'relative'
  },
  header: {
    padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },
  content: {
    padding: '20px', overflowY: 'auto'
  },
  footer: {
    padding: '15px 20px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#f9fafb', borderRadius: '0 0 10px 10px'
  },
  closeBtn: {
    background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#666'
  },
  table: {
    width: '100%', borderCollapse: 'collapse', fontSize: '14px'
  },
  th: {
    textAlign: 'left', padding: '12px', color: '#6b7280', fontWeight: '600'
  },
  td: {
    padding: '12px', color: '#374151'
  },
  btnCerrar: {
    padding: '8px 16px', backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontWeight: '500'
  },
  input: {
    padding: '5px', borderRadius: '4px', border: '1px solid #ccc', width: '80px'
  },
  btnIcon: {
    background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '0 5px'
  },
  btnPrimary: {
    backgroundColor: '#4F46E5', color: 'white', border: 'none', padding: '8px 16px', 
    borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px'
  },
  select: {
    padding: '5px', borderRadius: '4px', border: '1px solid #ccc', width: '100%', fontSize: '13px'
  }
};

export default VentanaPlanes;
