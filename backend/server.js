require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Configuración de CORS y JSON
app.use(cors());
app.use(express.json());

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('¡Conectado exitosamente a MongoDB!'))
  .catch(err => console.error('Error conectando a MongoDB:', err));

// --- MODELOS DE BASE DE DATOS ---
const User = mongoose.model('User', new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}));

const Tarea = mongoose.model('Tarea', new mongoose.Schema({
  nombre: { type: String, required: true },
  usuarioId: { type: String, required: true }
}));

// --- MIDDLEWARE DE SEGURIDAD (JWT) ---
// Protege las rutas para que solo usuarios logueados puedan usarlas
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ error: 'Acceso denegado. Se requiere token.' });
  try {
    const verificado = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    req.usuario = verificado;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Token inválido o expirado.' });
  }
};

// --- RUTAS DE AUTENTICACIÓN ---
app.post('/api/auth/register', async (req, res, next) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    const nuevoUsuario = new User({ email: req.body.email, password: hashedPassword });
    await nuevoUsuario.save();
    res.json({ mensaje: 'Usuario registrado exitosamente' });
  } catch (error) { next(error); } 
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).json({ error: 'Usuario no encontrado' });
    
    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Contraseña incorrecta' });
    
    // Genera el token que dura 1 hora
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) { next(error); }
});

// --- RUTAS CRUD (Protegidas) ---
// Crear Tarea
app.post('/api/tareas', authMiddleware, async (req, res, next) => {
  try {
    const tarea = new Tarea({ nombre: req.body.nombre, usuarioId: req.usuario._id });
    await tarea.save();
    res.json(tarea);
  } catch (error) { next(error); }
});

// Leer Tareas del usuario
app.get('/api/tareas', authMiddleware, async (req, res, next) => {
  try {
    const tareas = await Tarea.find({ usuarioId: req.usuario._id });
    res.json(tareas);
  } catch (error) { next(error); }
});

// Eliminar Tarea
app.delete('/api/tareas/:id', authMiddleware, async (req, res, next) => {
  try {
    await Tarea.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Tarea eliminada correctamente' });
  } catch (error) { next(error); }
});

// --- MANEJO DE ERRORES (Requisito de la rúbrica) ---
// Error 404: Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada (Error 404)' });
});

// Middleware Global de Errores (Evita que el servidor se caiga)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));