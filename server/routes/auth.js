import { Router } from 'express';
import bcrypt from 'bcrypt';

export default (pool) => {
    const router = Router(); 

    // Ruta de autenticación 
    router.post('/login', async (req, res) => {
        const { username, password } = req.body;
        try {
            const connection = await pool.getConnection();
            const [results] = await connection.execute('SELECT password FROM users WHERE username = ?', [username]);
            connection.release();
    
            if (results.length === 0) {
                // Si no se encuentra ningún usuario con ese nombre de usuario
                return res.status(404).json({ message: 'Usuari no trobat' });
            }
    
            const isMatch = await bcrypt.compare(password, results[0].password);
            if (isMatch) {
                res.status(200).json({ message: 'Inici de sessió amb èxit' });
            } else {
                res.status(401).json({ message: 'Credencials invàlides' });
            }
    
        } catch (error) {
            res.status(500).json({ message: 'Error en verificar les credencials', error });
        }
    });

    // Ruta de creación de usuario 
    router.post('/signup', async (req, res) => {
        const { username, password } = req.body;

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const connection = await pool.getConnection();
            const [results] = await connection.execute('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
            connection.release();

            res.status(200).json({ message: 'Registre completat amb èxit' });
        } catch (error) {
            res.status(500).json({ message: 'Error en registrar l\'usuari', error });
        }
    });

    return router;
};
