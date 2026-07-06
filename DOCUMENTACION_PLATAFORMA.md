# Documentacion de Plataforma - DATUM Reservas

## Que hace la plataforma

DATUM Reservas es una plataforma web para que clientes de DATUM Mediciones puedan cotizar y reservar servicios de medicion tecnica:

- Nube de Puntos 3D.
- Planos 2D Estado Actual.
- Modelo 3D Revit.

El sistema calcula el precio segun superficie, servicio y adicionales, permite elegir una fecha disponible, recoge datos del cliente e inmueble, genera un enlace de pago de deposito con Square y guarda la reserva en Supabase.

Incluye un portal administrativo en `/admin` para gestionar reservas, agenda, clientes, bloqueos de horario y codigos de descuento.

## Flujo principal del usuario

1. El usuario entra en la pagina publica.
2. Selecciona el servicio.
3. Indica la superficie del inmueble.
4. Agrega adicionales si corresponde.
5. Elige tipo de representacion:
   - Geometria real.
   - Representacion ortogonalizada.
6. Selecciona fecha y hora disponible.
7. Completa datos personales y datos del inmueble.
8. Revisa el resumen de precio:
   - Base imponible.
   - Descuento, si aplica.
   - IVA.
   - Total.
   - Deposito para reservar.
   - Saldo pendiente.
9. Acepta terminos obligatorios.
10. Pulsa `Pagar deposito y reservar`.
11. La plataforma crea una reserva pendiente y genera un enlace de pago de Square.
12. El usuario paga en Square.
13. Square redirige a la pagina de confirmacion.
14. El webhook de Square confirma realmente el pago.
15. La reserva pasa a confirmada y se envian correos automaticos.

## Que pasa si el usuario no paga

Si el usuario llega a Square pero abandona el carrito:

- La reserva queda en Supabase como `pendiente_de_pago`.
- No se envia correo de confirmacion al cliente.
- No se contabiliza el uso del cupon como usado.
- El administrador puede revisar esa reserva pendiente desde `/admin`.

## Conexion con Supabase

Supabase se usa como base de datos principal. La aplicacion se conecta desde rutas de servidor usando una clave privada configurada en variables de entorno.

Tablas principales:

- `reservations`: reservas, cliente, inmueble, precios, estado de pago y estado operativo.
- `blocked_slots`: horarios bloqueados manualmente desde el admin.
- `square_webhook_events`: eventos procesados de Square para evitar duplicados.
- `discount_codes`: codigos de descuento.
- `discount_code_redemptions`: control de uso de cupones por email cuando aplica `1 uso por cliente`.

## Informacion guardada en base de datos

En cada reserva se guarda:

- Nombre, email y telefono del cliente.
- Direccion completa, codigo postal y datos del inmueble.
- Servicio seleccionado.
- Superficie.
- Adicionales.
- Tipo de representacion.
- Fecha y hora.
- Precios calculados.
- Descuento aplicado, si existe.
- Total, deposito y saldo pendiente.
- Estado de pago.
- Estado operativo.
- Enlaces y referencias de Square.
- Notas del cliente.
- Notas internas del administrador.
- Aceptacion de comunicaciones comerciales.

En codigos de descuento se guarda:

- Codigo.
- Tipo de descuento.
- Valor.
- Estado activo/inactivo.
- Fecha de vencimiento.
- Limite total de usos.
- Uso unico por email, si aplica.
- Base minima.
- Usos acumulados.

## Servicios externos usados

### Supabase

Base de datos de reservas, bloqueos, codigos y eventos.

### Square

Pasarela de pagos. La plataforma usa Square Payment Links para:

- Deposito inicial.
- Saldo pendiente generado desde admin.

La confirmacion real del pago depende del webhook `payment.updated`.

### Resend

Servicio de email transaccional. Se usa para:

- Avisar internamente de una solicitud pendiente de pago.
- Enviar confirmacion al cliente cuando Square confirma el deposito.
- Enviar confirmacion interna cuando el deposito queda pagado.

### Vercel

Hosting y despliegue de la aplicacion Next.js.

### GitHub

Repositorio de codigo fuente.

### Dominio/DNS

Se usa para la configuracion de correo transaccional con Resend. El dominio exacto de la web publica con dominio propio queda pendiente de confirmar si se usara uno distinto al dominio de Vercel.

## Que puede administrar el cliente

Desde `/admin`, el cliente puede:

- Ver metricas generales.
- Revisar proximas citas.
- Ver calendario mensual.
- Bloquear y liberar horarios.
- Revisar reservas.
- Buscar reservas por cliente, email o telefono.
- Filtrar reservas por estado.
- Cambiar estado operativo.
- Cambiar estado de pago.
- Escribir notas internas.
- Generar enlace de pago del saldo pendiente en Square.
- Revisar clientes agrupados por email.
- Crear, activar, desactivar y eliminar codigos de descuento.
- Configurar codigos con limite total, fecha de vencimiento, base minima y uso unico por email.

## Politicas y reglas relevantes

- Se aceptan reservas de lunes a viernes segun horarios configurados en `lib/availability.ts`.
- No se permiten fechas pasadas.
- Inmuebles de mas de 400 m2 requieren presupuesto personalizado.
- El deposito es el 50% del total.
- El IVA aplicado es 21%.
- Los codigos se aplican antes del IVA.
- El cliente puede solicitar cambio de fecha hasta 48 horas antes de la cita; pasado ese plazo debe coordinar directamente con DATUM.
- Los pagos se consideran confirmados solo por webhook de Square.

## Puntos importantes a tener en cuenta

- Si se cambian precios, servicios u horarios, hay que editar archivos de codigo:
  - Precios y servicios: `lib/pricing.ts`.
  - Horarios: `lib/availability.ts`.
- Si se cambia una variable de entorno en Vercel, se debe hacer redeploy.
- El acceso admin depende de `ADMIN_EMAILS` y `ADMIN_PASSWORD`.
- El proyecto no incluye sistema avanzado de roles ni recuperacion de contrasena.
- El envio de emails depende de Resend y de que el dominio este verificado.
- El webhook de Square debe mantenerse activo y con la URL correcta.
- La eliminacion de codigos de descuento es definitiva.
- Pendiente de confirmar: dominio final publico si se conectara un dominio distinto a `datum-reservas.vercel.app`.
