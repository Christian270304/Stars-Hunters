import { Router } from 'express';

export default (pool) => {
    const router = Router(); 

    // Ruta de autenticación 
    router.post('/login', async (req, res) => {
        const { username, password } = req.body;
        try {
            const connection = await pool.getConnection();
            const [results] = await connection.execute('SELECT password FROM users WHERE username = ?', [username]);
            connection.release();

            if (results.length > 0 && results[0].password === password) {
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
            const connection = await pool.getConnection();
            const [results] = await connection.execute('INSERT INTO users (username, password) VALUES (?, ?)', [username, password]);
            connection.release();

            res.status(200).json({ message: 'Registre completat amb èxit' });
        } catch (error) {
            res.status(500).json({ message: 'Error en registrar l\'usuari', error });
        }
    });

    return router;
};
