# Accesos y Entrega

Este documento resume los accesos que el cliente debe conservar para operar y mantener la plataforma.

No incluir aqui contrasenas, tokens, API keys ni claves privadas. Guardar esos datos en un gestor de contrasenas seguro.

## GitHub / Repositorio

- Repositorio: `https://github.com/medicionesdatum/datum-reservas.git`
- Sirve para: conservar el codigo fuente y el historial de cambios.
- Debe tener acceso: cliente propietario del proyecto y programadores autorizados.
- Nivel recomendado:
  - Cliente: Owner o Admin de la organizacion/repositorio.
  - Programador de mantenimiento: Collaborator con permisos de escritura.
  - Soporte puntual: acceso temporal.
- Proteger:
  - Acceso a la cuenta de GitHub.
  - Permisos de administracion del repositorio.
  - No subir archivos `.env` ni claves al repositorio.

## Vercel

- Sirve para: despliegue, hosting, variables de entorno y logs de produccion.
- Debe tener acceso: cliente y programador responsable del despliegue.
- Nivel recomendado:
  - Cliente: Owner/Admin del proyecto o equipo.
  - Programador: Admin o Developer segun necesidad.
- Proteger:
  - Variables de entorno.
  - Permisos de deploy.
  - Logs que puedan contener informacion sensible de errores.
- Importante:
  - El proyecto se despliega desde GitHub.
  - Cada cambio en variables de entorno requiere redeploy.

## Supabase

- Sirve para: base de datos de reservas, bloqueos, descuentos y eventos de pago.
- Debe tener acceso: cliente propietario y programador de mantenimiento.
- Nivel recomendado:
  - Cliente: Owner del proyecto.
  - Programador: acceso con permisos suficientes para SQL y configuracion cuando haya mantenimiento.
- Proteger:
  - URL del proyecto.
  - Clave secreta/service role.
  - Password de base de datos.
  - Acceso al SQL Editor.
- Tablas clave:
  - `reservations`
  - `blocked_slots`
  - `square_webhook_events`
  - `discount_codes`
  - `discount_code_redemptions`

## Dominio / DNS

- Sirve para: dominio web, configuracion de email transaccional y registros DNS.
- Debe tener acceso: cliente propietario y proveedor/tecnico DNS autorizado.
- Nivel recomendado:
  - Cliente: titular de la cuenta del dominio.
  - Programador o soporte: acceso temporal o solicitud de cambios por escrito.
- Proteger:
  - Acceso al panel del dominio.
  - Registros DNS.
  - Registros de email, DKIM, SPF, MX.
- Estado:
  - Resend usa DNS del dominio para enviar emails.
  - Pendiente de confirmar: si la web publica usara un dominio propio distinto al dominio de Vercel.

## Square

- Sirve para: procesar pagos del deposito y generar enlaces de pago del saldo pendiente.
- Debe tener acceso: cliente o responsable financiero, y programador solo si debe mantener la integracion.
- Nivel recomendado:
  - Cliente/responsable financiero: Owner/Admin.
  - Programador: acceso tecnico minimo necesario.
- Proteger:
  - Production Access Token.
  - Location ID.
  - Webhook Signature Key.
  - Cuenta bancaria y datos fiscales.
- Configuracion importante:
  - Entorno de produccion.
  - Webhook para `payment.updated`.
  - URL del webhook: `/api/square/webhook`.

## Resend

- Sirve para: envio automatico de emails transaccionales.
- Debe tener acceso: cliente y programador de mantenimiento.
- Nivel recomendado:
  - Cliente: Owner/Admin.
  - Programador: acceso para revisar dominio, API keys y logs si hay incidencias.
- Proteger:
  - `RESEND_API_KEY`.
  - Configuracion del dominio verificado.
  - Registros DNS asociados.
- Emails que envia la plataforma:
  - Aviso interno de solicitud pendiente de pago.
  - Confirmacion al cliente cuando Square confirma el deposito.
  - Confirmacion interna cuando el deposito queda pagado.

## Portal Administrativo

- URL: `/admin` dentro de la web desplegada.
- Sirve para: operar reservas, agenda, bloqueos, clientes y descuentos.
- Debe tener acceso: personal autorizado por DATUM.
- Nivel recomendado:
  - Solo usuarios internos autorizados.
- Proteger:
  - Email autorizado.
  - Clave de administracion.
- Importante:
  - El acceso admin se configura con `ADMIN_EMAILS` y `ADMIN_PASSWORD`.
  - No hay roles separados por usuario.

## Variables de entorno

Las variables se configuran en Vercel y, para desarrollo local, en `.env.local`.

Nombres usados por el proyecto:

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

## Titularidad de cuentas

El proyecto fue creado y configurado con cuentas del cliente. El cliente conserva el acceso principal y la titularidad de los servicios. La persona que desarrollo o mantiene la plataforma puede quedar como colaborador o admin solo si el cliente requiere soporte, mantenimiento o nuevas funcionalidades.

## Recomendaciones de entrega

- Confirmar que el cliente puede entrar a GitHub, Vercel, Supabase, Square, Resend y dominio/DNS.
- Confirmar que los metodos de pago y facturacion estan a nombre del cliente.
- Guardar credenciales y claves en un gestor seguro.
- Revocar accesos de soporte cuando ya no sean necesarios.
- Mantener activada la verificacion en dos pasos en cuentas criticas.
