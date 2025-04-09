require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const userRoutes = require('./routes/users');
const noticeRoutes = require('./routes/notices');
const visitorRoutes = require('./routes/visitors');
const chatRoutes = require('./routes/chat');
const maintenanceRequestsRoutes = require('./routes/maintenanceRequests');

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie']
}));

// Middleware
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/visitor-pre-approvals', visitorRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/maintenance-requests', maintenanceRequestsRoutes); 

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});