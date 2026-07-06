# DATUM Reservas

Plataforma web para cotizar, reservar y pagar mediciones tecnicas de DATUM Mediciones.

## Descripcion

La aplicacion permite que un cliente seleccione un servicio, introduzca los datos del inmueble, elija fecha y hora disponibles, calcule el precio, aplique un codigo de descuento y pague un deposito mediante Square. Incluye un portal administrativo para revisar reservas, agenda, clientes, bloqueos de horario, estados de pago y codigos de descuento.

## Stack tecnologico

- Next.js 15 con App Router.
- React 19.
- TypeScript.
- Tailwind CSS.
- Supabase como base de datos.
- Square para enlaces de pago.
- Resend para correo transaccional.
- Vercel para despliegue.

## Instalacion local

```bash
npm install
npm run dev
```

La aplicacion local queda disponible normalmente en `http://localhost:3000`.

## Comandos principales

```bash
npm run dev        # Desarrollo local
npm run build      # Build de produccion
npm run start      # Ejecutar build local
npm run typecheck  # Validacion TypeScript
npm run lint       # Lint de Next.js, pendiente de migrar si Next lo solicita
```

## Variables de entorno necesarias

Configurar en `.env.local` para desarrollo y en Vercel para produccion. No guardar valores reales en el repositorio.

```text
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SECRET_KEY
SUPABASE_SERVICE_ROLE_KEY
ADMIN_EMAILS
ADMIN_PASSWORD
RESERVATION_NOTIFICATION_EMAILS
SQUARE_ACCESS_TOKEN
SQUARE_LOCATION_ID
SQUARE_ENVIRONMENT
SQUARE_WEBHOOK_SIGNATURE_KEY
RESEND_API_KEY
EMAIL_FROM
```

Notas:

- `SUPABASE_SECRET_KEY` o `SUPABASE_SERVICE_ROLE_KEY`: se usa solo en servidor.
- `SQUARE_ENVIRONMENT`: usar `production` en produccion.
- `NEXT_PUBLIC_APP_URL`: debe coincidir con la URL publica usada por Square y el webhook.
- `ADMIN_PASSWORD`: protege el portal `/admin`; no debe compartirse fuera del equipo autorizado.

## Deploy

El proyecto esta conectado a GitHub y se despliega en Vercel.

Flujo recomendado:

1. Hacer cambios en el repositorio.
2. Subir cambios a la rama principal.
3. Vercel crea un deploy automaticamente.
4. Confirmar que el deploy quede en estado `Ready`.

Antes de operar en produccion, verificar:

- Variables de entorno configuradas en Vercel.
- Esquema de Supabase ejecutado.
- Webhook de Square apuntando a `/api/square/webhook`.
- Dominio de Resend verificado para enviar correos.

## Estructura basica

```text
app/
  page.tsx                    # Pagina publica de reservas
  admin/page.tsx              # Portal administrativo
  confirmacion/page.tsx       # Pantalla posterior al pago
  api/                        # Rutas de servidor
components/
  BookingFlow.tsx             # Flujo publico de reserva
  AdminDashboard.tsx          # Portal administrativo
  PaymentConfirmation.tsx     # Verificacion posterior al pago
lib/
  availability.ts             # Horarios permitidos
  pricing.ts                  # Servicios, rangos y calculo de precio
  square.ts                   # Integracion con Square
  supabase.ts                 # Cliente Supabase servidor
  email.ts                    # Envio con Resend
  discount-codes.ts           # Logica de cupones
  reservation-emails.ts       # Plantillas de correo
supabase/
  schema.sql                  # Esquema principal
  discount-redemptions.sql    # Migracion de uso unico por email
public/assets/
  datum-logo.png
  datum-hero.jpg
```

## Notas importantes para programadores

- El pago no se confirma por redireccion del usuario. Solo se confirma con el webhook firmado de Square.
- Las reservas quedan inicialmente como `pendiente_de_pago`.
- Si Square confirma el deposito, la reserva cambia a `reserva_confirmada` y se envian correos.
- Si el cliente abandona el checkout, la reserva permanece pendiente y no se envia correo de confirmacion al cliente.
- Los codigos de descuento se aplican antes del IVA.
- Los usos de cupones se contabilizan cuando Square confirma el pago, no al iniciar el checkout.
- La disponibilidad combina reservas existentes y bloqueos administrativos.
- El admin no tiene sistema de usuarios completo; valida email y clave mediante variables de entorno.
- Hay modo demo si faltan claves de Supabase o Square, pero no debe usarse para produccion.
