import express from 'express';
import { obtenerProductos } from '../controllers/catalogoController.js';

const router = express.Router();
router.get('/products', obtenerProductos);

export default router;


