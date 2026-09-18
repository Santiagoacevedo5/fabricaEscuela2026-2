import { useState } from 'react';
import Tiendas from './Tiendas';
import Productos from './components/Productos';

function App() {
  const [vista, setVista] = useState('tiendas');

  return vista === 'productos' ? (
    <Productos onNavigate={setVista} />
  ) : (
    <Tiendas onNavigate={setVista} />
  );
}

export default App;