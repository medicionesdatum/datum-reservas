# Guia del Portal Admin

## Acceso

El portal administrativo esta disponible en:

```text
/admin
```

Para entrar se necesita:

- Correo autorizado.
- Clave de administracion.

Estos accesos se configuran mediante variables de entorno y no deben compartirse publicamente.

## Secciones del admin

### Resumen

Muestra una vista general de la actividad:

- Citas de hoy.
- Reservas totales.
- Depositos cobrados.
- Ingresos completados.
- Porcentaje de confirmacion.
- Proximas citas.
- Horarios bloqueados.
- Saldos pendientes.
- Mediciones realizadas.
- Trabajos entregados.

Uso recomendado: revisar al inicio del dia para entender la actividad general.

### Calendario

Permite revisar la agenda por mes y por dia.

Muestra:

- Dias con citas.
- Dias con bloqueos.
- Horarios disponibles del dia seleccionado.
- Reservas con nombre del cliente.
- Bloqueos creados por administracion.

Acciones disponibles:

- Pulsar una hora libre, escribir la razon y confirmar el bloqueo.
- Liberar un bloqueo existente.

Importante: si una hora tiene reserva, no debe bloquearse manualmente. Si se necesita cambiar una cita, debe gestionarse desde la reserva y con comunicacion directa con el cliente.

### Reservas

Permite buscar, filtrar y revisar reservas.

Se puede buscar por:

- Nombre del cliente.
- Email.
- Telefono.

Se puede filtrar por estado operativo.

Informacion visible:

- Cliente.
- Email.
- Telefono.
- Servicio.
- Fecha y hora.
- Superficie.
- Direccion.
- Total.
- Deposito.
- Saldo pendiente.
- Estado operativo.
- Estado de pago.
- Notas internas.
- Enlace de deposito, si existe.
- Enlace de saldo, si existe.

Acciones disponibles:

- Cambiar estado operativo.
- Cambiar estado de pago.
- Agregar o modificar notas internas.
- Generar enlace de pago del saldo pendiente en Square.

### Clientes

Agrupa las reservas por email del cliente.

Permite revisar:

- Clientes unicos.
- Datos de contacto.
- Numero de reservas.
- Facturacion acumulada.
- Ultima reserva.

Desde esta seccion se puede abrir la ficha de la reserva mas reciente del cliente.

### Descuentos

Permite gestionar codigos de descuento.

Al crear un codigo se puede definir:

- Codigo.
- Tipo: porcentaje o importe fijo.
- Valor.
- Fecha de vencimiento.
- Limite total de usos.
- Uso unico por cliente/email.
- Base minima.

Acciones disponibles:

- Crear codigo.
- Activar o desactivar codigo.
- Marcar o quitar `1 por email`.
- Eliminar codigo.

Importante:

- Los codigos se aplican antes del IVA.
- El uso se contabiliza cuando Square confirma el pago.
- Si el cliente abandona el checkout, no se consume el cupon.

## Estados de reserva

Estados operativos disponibles:

- Nueva solicitud.
- Pendiente de pago.
- Deposito pagado.
- Reserva confirmada.
- Visita programada.
- Medicion realizada.
- En procesamiento.
- Pendiente de saldo.
- Pagado por completo.
- Entregado.
- Cancelado.
- Reprogramado.

Estados de pago disponibles:

- Pendiente.
- Deposito pagado.
- Pagado por completo.

## Flujo recomendado de uso diario

1. Entrar al admin.
2. Revisar `Resumen`.
3. Abrir `Calendario` y revisar citas del dia.
4. Revisar si hay reservas pendientes de pago.
5. Atender reservas confirmadas.
6. Bloquear horarios no disponibles si el equipo no puede atenderlos.
7. Actualizar estados operativos conforme avance el trabajo.
8. Agregar notas internas cuando haya informacion relevante.
9. Generar enlace de saldo pendiente cuando corresponda.
10. Revisar codigos de descuento activos si hay campañas vigentes.

## Campos que puede editar el administrador

Puede editar con normalidad:

- Estado operativo.
- Estado de pago.
- Notas internas.
- Bloqueos de horarios.
- Codigos de descuento.
- Enlace de saldo, mediante el boton `Generar saldo en Square`.

## Campos que no deberia modificar sin soporte tecnico

No modificar manualmente en Supabase sin soporte:

- IDs de reserva.
- Referencias de Square.
- Importes calculados.
- Fecha y hora directamente en base de datos.
- Email del cliente en reservas ya pagadas.
- Registros de `square_webhook_events`.
- Registros de `discount_code_redemptions`.

Si hay que corregir una reserva pagada, hacerlo con respaldo y dejando nota interna.

## Situaciones importantes

### Cliente abandona el pago

La reserva queda como pendiente de pago. No recibe correo de confirmacion y el cupon no se marca como usado.

### Cliente paga el deposito

Square envia webhook, la reserva pasa a confirmada y se envian correos automaticos.

### Cliente necesita cambiar fecha

La politica indica que puede solicitar cambio hasta 48 horas antes. Pasado ese plazo debe coordinar directamente con DATUM.

### Horario bloqueado por error

Ir a `Calendario`, seleccionar el dia y pulsar `Liberar` en el bloqueo.

### Codigo de descuento no funciona

Revisar:

- Que este activo.
- Que no este vencido.
- Que no haya alcanzado el limite de usos.
- Que cumpla la base minima.
- Que el email no lo haya usado antes si esta marcado como `1 por email`.

## Si algo no carga o aparece un error

1. Revisar conexion a internet.
2. Recargar la pagina.
3. Confirmar que el correo y clave admin son correctos.
4. Revisar si Vercel muestra el despliegue en estado `Ready`.
5. Revisar logs de Vercel si el error ocurre al crear reservas, generar pagos o cargar admin.
6. Revisar Supabase si no aparecen datos.
7. Revisar Square si falla la creacion de enlaces de pago.
8. Revisar Resend si no llegan correos.

Si el error ocurre despues de cambiar variables de entorno, hacer redeploy en Vercel.

## Seguridad basica

- No compartir la clave de administracion por WhatsApp o email sin proteccion.
- No reutilizar la clave admin en otros servicios.
- Cerrar sesion o cerrar la pestana en ordenadores compartidos.
- Usar accesos individuales en GitHub, Vercel, Supabase, Square y Resend.
- Mantener verificacion en dos pasos en cuentas criticas.
- Dar acceso de colaborador solo a personas que realmente lo necesiten.
- Revocar accesos cuando termine el soporte externo.
