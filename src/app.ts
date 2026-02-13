import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';

const app = express();

// Middleware
app.use(cors());
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// Routes Placeholder
import authRoutes from './modules/auth/auth.routes';
import residentsRoutes from './modules/residents/residents.routes';
import accessRoutes from './modules/access_control/access.routes';
import visitsRoutes from './modules/visits/visits.routes';
import parkingRoutes from './modules/parking/parking.routes';
import amenitiesRoutes from './modules/amenities/amenities.routes';
import storeRoutes from './modules/store/store.routes';
import configRoutes from './modules/config/config.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import pqrsRoutes from './modules/pqrs/pqrs.routes';
import documentsRoutes from './modules/documents/documents.routes';
import votingRoutes from './modules/voting/voting.routes';
import financeRoutes from './modules/finance/finance.routes';
import mobileRoutes from './api/mobile/mobile.routes';
import superAdminRoutes from './modules/super-admin/super-admin.routes';
import paymentRoutes from './modules/payments/payments.routes';
import unitsRoutes from './modules/units/units.routes';
import path from 'path';

// Serve static files from organized backup directory
// Serve static files from organized backup directory
const backupPath = process.env.BACKUP_PATH || path.join(process.cwd(), 'BACKUP_SISTEMA_RESIDENCIAL');
app.use('/backup', express.static(backupPath));

app.get('/', (req, res) => {
    res.send('Residential Management System API is running 🚀');
});

app.get('/health', (req, res) => {
    res.json({ status: 'OK', uptime: process.uptime() });
});

import saasRoutes from './modules/saas/saas.routes';

// ... midddleware ...

// app.use('/api/complexes', complexRoutes); // Deprecated/Removed
app.use('/api/saas', saasRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/residents', residentsRoutes);
app.use('/api/access', accessRoutes);
app.use('/api/visits', visitsRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/amenities', amenitiesRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/config', configRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/pqrs', pqrsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/voting', votingRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/mobile/v1', mobileRoutes);
app.use('/api/super-admin', superAdminRoutes); // Deprecated? Mantener por ahora
app.use('/api/payments', paymentRoutes);
app.use('/api/units', unitsRoutes);

// Initialize backup scheduler
import { initializeBackupScheduler } from './config/scheduler';
initializeBackupScheduler();

export default app;
