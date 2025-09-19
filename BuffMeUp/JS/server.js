const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Middleware to verify admin token (optional, for added security)
const verifyAdminToken = async (req, res, next) => {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    
    try {
        await admin.auth().verifyIdToken(token);
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token', message: error.message });
    }
};

// Users Collection
app.get('/api/users', verifyAdminToken, async (req, res) => {
    try {
        const snapshot = await db.collection('users').get();
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users', message: error.message });
    }
});

app.post('/api/users/toggle-status/:id', verifyAdminToken, async (req, res) => {
    try {
        const userId = req.params.id;
        const userRef = db.collection('users').doc(userId);
        const user = await userRef.get();
        if (!user.exists) return res.status(404).json({ error: 'User not found' });
        
        const newStatus = user.data().status === 'Active' ? 'Suspended' : 'Active';
        await userRef.update({ status: newStatus, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        res.json({ success: true, message: 'User status updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to toggle user status', message: error.message });
    }
});

// Products Collection
app.get('/api/products', verifyAdminToken, async (req, res) => {
    try {
        const snapshot = await db.collection('products').get();
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch products', message: error.message });
    }
});

app.post('/api/products', verifyAdminToken, async (req, res) => {
    try {
        const productData = req.body;
        const product = {
            ...productData,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        const docRef = await db.collection('products').add(product);
        res.json({ success: true, id: docRef.id, message: 'Product added successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add product', message: error.message });
    }
});

app.put('/api/products/:id', verifyAdminToken, async (req, res) => {
    try {
        const productId = req.params.id;
        const productData = req.body;
        await db.collection('products').doc(productId).update({
            ...productData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.json({ success: true, message: 'Product updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update product', message: error.message });
    }
});

app.delete('/api/products/:id', verifyAdminToken, async (req, res) => {
    try {
        const productId = req.params.id;
        await db.collection('products').doc(productId).delete();
        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete product', message: error.message });
    }
});

// Orders Collection
app.get('/api/orders', verifyAdminToken, async (req, res) => {
    try {
        const snapshot = await db.collection('orders').get();
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders', message: error.message });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        const orderData = req.body;
        const order = {
            ...orderData,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        const docRef = await db.collection('orders').add(order);
        res.json({ success: true, id: docRef.id, message: 'Order created successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create order', message: error.message });
    }
});

app.put('/api/orders/:id/status', verifyAdminToken, async (req, res) => {
    try {
        const orderId = req.params.id;
        const { status } = req.body;
        await db.collection('orders').doc(orderId).update({
            status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.json({ success: true, message: 'Order status updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update order status', message: error.message });
    }
});

app.delete('/api/orders/:id', verifyAdminToken, async (req, res) => {
    try {
        const orderId = req.params.id;
        await db.collection('orders').doc(orderId).delete();
        res.json({ success: true, message: 'Order deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete order', message: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});