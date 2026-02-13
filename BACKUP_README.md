# 📋 Sistema de Backup Automático

## 🎯 Características

- **Backup Diario Automático**: Se ejecuta todos los días a las 2:00 AM
- **Rotación de 31 Días**: Mantiene los últimos 31 días de backups
- **Sobrescritura Automática**: Cuando llega el día 32, se elimina el backup del día 1
- **Organización por Módulos**: Cada tipo de dato en su propia carpeta

## 📁 Estructura de Carpetas

```
BACKUP_SISTEMA_RESIDENCIAL/
├── RESIDENTES/
│   └── fotos de residentes
├── VISITANTES/
│   └── fotos de visitantes
├── PARQUEADEROS/
│   └── fotos de vehículos (futuro)
├── AMENIDADES/
│   └── fotos de instalaciones (futuro)
├── TIENDA/
│   └── fotos de productos (futuro)
└── BASE_DE_DATOS/
    ├── backup_dia_01_2026-01-23_02-00-00.db
    ├── backup_dia_02_2026-01-24_02-00-00.db
    ├── backup_dia_03_2026-01-25_02-00-00.db
    └── ... (hasta día 31)
```

## 🔄 Funcionamiento de la Rotación

### Ejemplo Práctico:

**Día 1 (Enero 23):**
- Se crea: `backup_dia_23_2026-01-23_02-00-00.db`

**Día 2 (Enero 24):**
- Se crea: `backup_dia_24_2026-01-24_02-00-00.db`

**Día 31 (Febrero 22):**
- Se crea: `backup_dia_22_2026-02-22_02-00-00.db`

**Día 32 (Febrero 23):**
- Se elimina el backup más antiguo del día 23
- Se crea: `backup_dia_23_2026-02-23_02-00-00.db` (nuevo)

## ⏰ Programación

- **Horario**: 2:00 AM todos los días
- **Backup Inicial**: Se crea automáticamente 5 segundos después de iniciar el servidor
- **Limpieza**: Automática, mantiene solo últimos 31 días

## 🛠️ Comandos Útiles

### Crear Backup Manual
```bash
node test-backup.js
```

### Ver Estadísticas
El servidor muestra estadísticas cada vez que crea un backup:
```
📊 Estadísticas de backup:
   Total de backups: 15
   Día más antiguo: 8
   Día más reciente: 23
   Tamaño total: 2450.50 KB
```

## 💾 Cómo Hacer Backup Externo

### Opción 1: Manual
1. Copia toda la carpeta `BACKUP_SISTEMA_RESIDENCIAL`
2. Pégala en:
   - USB/Disco externo
   - OneDrive/Google Drive
   - Otro disco duro

### Opción 2: Automático con Windows
1. Abre "Configuración de Windows"
2. Ve a "Actualización y seguridad" > "Copia de seguridad"
3. Agrega la carpeta `BACKUP_SISTEMA_RESIDENCIAL`

### Opción 3: Sincronización en la Nube
1. Mueve la carpeta a OneDrive/Google Drive
2. Actualiza la variable de entorno `BACKUP_PATH` en `.env`:
   ```
   BACKUP_PATH="C:/Users/Usuario/OneDrive/BACKUP_SISTEMA_RESIDENCIAL"
   ```

## 📊 Tamaño Estimado

- **Base de datos**: ~150-300 KB por backup
- **31 días**: ~5-10 MB total
- **Fotos**: Depende del uso (cada foto ~100-500 KB)

## 🔐 Restaurar Backup

Para restaurar un backup específico, contacta al administrador del sistema o usa el panel de administración (próximamente).

## ⚙️ Personalización

### Cambiar Horario de Backup
Edita `src/config/scheduler.ts`:
```typescript
// Cambiar de 2:00 AM a 3:00 AM
cron.schedule('0 3 * * *', async () => {
    // ...
});
```

### Cambiar Cantidad de Días
Edita `src/services/backup.service.ts`:
```typescript
private maxBackupDays = 31; // Cambiar a 60, 90, etc.
```

### Cambiar Ubicación
Edita `.env`:
```
BACKUP_PATH="D:/MisBackups/SistemaResidencial"
```
