# DATUM Reservas

Plataforma pública de cotización, reserva, disponibilidad, pago y administración para DATUM Mediciones.

## Inicio

```bash
npm install
npm run dev
```

Copia `.env.example` a `.env.local` y añade las claves reales de Supabase, Square y email.

Sin claves de Supabase o Square, la app funciona en modo de demostración. No debe publicarse así para recibir reservas reales.

## Flujo incluido

- Cotización automática por superficie.
- Adicionales por planta, sección o alzado.
- Representación obligatoria.
- Calendario con horarios válidos de DATUM.
- Datos de cliente e inmueble.
- Resumen con base imponible, IVA, depósito y saldo pendiente.
- Checkout alojado en Square mediante Payment Links.
- Confirmación del pago mediante webhook firmado de Square.
- Panel administrativo en `/admin` con métricas, agenda, clientes, bloqueos y pagos.

## Base de datos

El esquema de Supabase está en `supabase/schema.sql`.

## Publicación en producción

### 1. Supabase

1. Crea un proyecto en una región europea.
2. Ejecuta todo el contenido de `supabase/schema.sql` en el SQL Editor.
3. Copia la URL del proyecto y una clave secreta de servidor.
4. Configura en Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SECRET_KEY` (recomendado) o `SUPABASE_SERVICE_ROLE_KEY` (legado)

La clave secreta de Supabase se utiliza únicamente en rutas del servidor y nunca debe exponerse en el navegador.

### 2. Vercel

Importa el proyecto de Next.js o ejecuta el despliegue desde Vercel CLI. Configura estas variables para el entorno **Production**:

```text
NEXT_PUBLIC_APP_URL=https://reservas.tudominio.es
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SECRET_KEY=...
ADMIN_EMAILS=info@medicionesdatum.es,d.escobar@medicionesdatum.es
ADMIN_PASSWORD=...
RESERVATION_NOTIFICATION_EMAILS=d.escobar@medicionesdatum.es
SQUARE_ACCESS_TOKEN=...
SQUARE_LOCATION_ID=...
SQUARE_ENVIRONMENT=production
SQUARE_WEBHOOK_SIGNATURE_KEY=...
RESEND_API_KEY=...
EMAIL_FROM=DATUM Mediciones <info@medicionesdatum.es>
```

Cada cambio de variables en Vercel requiere un nuevo despliegue para aplicarse.

### 3. Square

1. Crea o selecciona la aplicación de producción en Square Developer Console.
2. Obtén el token de acceso y el identificador de ubicación de producción.
3. Crea una suscripción webhook con esta URL exacta:

```text
https://reservas.tudominio.es/api/square/webhook
```

4. Suscribe el evento `payment.updated`.
5. Copia la clave de firma del webhook en `SQUARE_WEBHOOK_SIGNATURE_KEY`.
6. Comprueba desde Square que el endpoint responde correctamente a un evento de prueba.

La reserva solo cambia a **confirmada** cuando el webhook recibe un pago `COMPLETED`, firmado por Square, en EUR y con el importe exacto esperado. La redirección del checkout por sí sola no confirma el pago.

### 4. Verificación antes de abrir al público

- Crear una reserva de importe mínimo con una tarjeta real.
- Confirmar que la cita aparece en el calendario administrativo.
- Confirmar que el depósito queda marcado como pagado.
- Verificar el correo de confirmación.
- Bloquear una franja desde administración y comprobar que desaparece en la reserva pública.
- Probar el pago del saldo pendiente desde el panel administrativo.
