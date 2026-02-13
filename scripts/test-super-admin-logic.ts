
import { PrismaClient } from '@prisma/client';
import { SuperAdminService } from '../src/modules/super-admin/super-admin.service';

const prisma = new PrismaClient();
const service = new SuperAdminService();

async function testSuperAdminLogic() {
    console.log('🚀 Iniciando pruebas de Super Admin...');

    // 1. Crear conjunto de prueba
    const nit = `TEST-${Date.now()}`;
    console.log(`\n1. Creando conjunto con NIT: ${nit}`);
    const complex = await service.createComplex({
        name: 'Conjunto de Prueba Automatizada',
        nit: nit,
        address: 'Calle Falsa 123',
        city: 'Bogotá',
        phone: '3001234567'
    });
    console.log('✅ Conjunto creado:', complex.id);

    // 2. Verificar estado inicial
    if (!complex.is_active || complex.subscription_status !== 'active') {
        throw new Error('❌ Estado inicial incorrecto');
    }
    console.log('✅ Estado inicial verificado (Activo)');

    // 3. Probar Kill Switch (Desactivar)
    console.log('\n2. Probando Kill Switch (Desactivar)...');
    const deactivated = await service.toggleComplexStatus(complex.id, false);
    if (deactivated.is_active || deactivated.subscription_status !== 'suspended') {
        throw new Error('❌ Falló la desactivación');
    }
    console.log('✅ Conjunto desactivado correctamente');

    // 4. Probar Kill Switch (Reactivar)
    console.log('\n3. Probando Kill Switch (Reactivar)...');
    const reactivated = await service.toggleComplexStatus(complex.id, true);
    if (!reactivated.is_active || reactivated.subscription_status !== 'active') {
        throw new Error('❌ Falló la reactivación');
    }
    console.log('✅ Conjunto reactivado correctamente');

    // 5. Probar Suscripción
    console.log('\n4. Probando actualización de suscripción...');
    const newDate = new Date();
    newDate.setFullYear(newDate.getFullYear() + 1);

    const updated = await service.updateSubscription(complex.id, {
        plan: 'premium',
        dueDate: newDate
    });

    if (updated.plan_type !== 'premium') throw new Error('❌ Falló actualización de plan');
    console.log('✅ Suscripción actualizada correctamente');

    // Cleanup
    console.log('\n🧹 Limpiando datos de prueba...');
    await prisma.residentialComplex.delete({ where: { id: complex.id } });
    console.log('✅ Datos eliminados');

}

testSuperAdminLogic()
    .catch(e => {
        console.error('❌ Error en pruebas:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
