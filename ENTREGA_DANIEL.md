# Entrega del proyecto DATUM Reservas

Este documento permite continuar el desarrollo y la operacion de la plataforma sin depender del equipo que realizo la implementacion inicial.

## Referencias principales

- Repositorio: `https://github.com/medicionesdatum/datum-reservas`
- Rama de produccion: `main`
- Web publica: `https://medicionesdatum.es`
- Dominio tecnico: `https://datum-reservas.vercel.app`
- Portal administrativo: `https://medicionesdatum.es/admin`

## Accesos que debe conservar el propietario

Daniel debe tener acceso individual, con verificacion en dos pasos, a:

- GitHub, incluida la organizacion `medicionesdatum`.
- Vercel y el proyecto `datum-reservas`.
- Supabase y su SQL Editor/Storage.
- Square en entorno de produccion.
- Resend y la configuracion del dominio.
- Notion y la base utilizada como CRM.
- Dominio `medicionesdatum.es` y sus registros DNS.
- Google Analytics y el correo corporativo.

No guardar contrasenas, tokens ni API keys en GitHub, documentos compartidos o conversaciones con asistentes de IA. Usar un gestor de contrasenas y los secretos de Vercel.

## Preparar el proyecto en un ordenador nuevo

Requisitos recomendados: Git, Node.js 22 y una cuenta de GitHub con acceso de escritura.

```bash
git clone https://github.com/medicionesdatum/datum-reservas.git
cd datum-reservas
npm install
cp .env.example .env.local
npm run dev
```

Los valores reales de `.env.local` deben obtenerse del gestor de contrasenas o configurarse con credenciales de desarrollo. No copiar secretos de produccion en un chat.

Validacion completa antes de publicar:

```bash
npm run check
```

## Trabajar con ChatGPT/Codex

1. Abrir la aplicacion de ChatGPT y seleccionar Codex.
2. Crear un proyecto local y agregar la carpeta clonada como carpeta principal.
3. Iniciar cada cambio en modo Worktree o en una rama nueva.
4. Pedir a Codex que lea `AGENTS.md`, `README.md`, `DOCUMENTACION_PLATAFORMA.md` y esta guia.
5. Revisar el diff y ejecutar `npm run check`.
6. Subir la rama y abrir un pull request.
7. Revisar la vista previa de Vercel antes de fusionar a `main`.

## Trabajar con Claude Code

Opcion local:

1. Clonar el repositorio y entrar en su carpeta.
2. Ejecutar `claude`.
3. Crear una rama nueva antes de pedir cambios.
4. Revisar el diff y ejecutar `npm run check` antes de publicar.

Opcion en la nube:

1. Entrar en `https://claude.ai/code`.
2. Conectar GitHub y seleccionar `medicionesdatum/datum-reservas`.
3. Encargar el cambio con un alcance concreto.
4. Revisar la rama y el pull request generados antes de fusionarlos.

La integracion de GitHub dentro de un chat normal de Claude es util para consultar archivos. Para hacer cambios completos, usar Claude Code local o en la nube.

## Flujo recomendado para cualquier cambio

```text
rama nueva
  -> cambio con Claude Code o Codex
  -> npm run check
  -> revision del diff
  -> pull request
  -> preview de Vercel
  -> merge a main
  -> verificacion en medicionesdatum.es
```

No trabajar directamente sobre `main` para cambios funcionales. No ejecutar migraciones, borrar datos ni modificar variables de produccion sin revisar primero el proyecto y la cuenta de destino.

## Donde vive cada parte

- Codigo y migraciones: GitHub.
- Despliegue, variables y logs: Vercel.
- Reservas, descuentos, articulos y portadas del blog: Supabase.
- Pagos: Square.
- Emails transaccionales: Resend.
- Copia CRM de reservas confirmadas: Notion.
- Carruseles, videos finales y archivos originales: paquete creativo entregado por separado.

## Documentacion incluida

- `README.md`: instalacion, arquitectura y variables.
- `DOCUMENTACION_PLATAFORMA.md`: funcionamiento tecnico y operativo.
- `GUIA_PORTAL_ADMIN.md`: uso del panel por parte del equipo DATUM.
- `ACCESOS_Y_ENTREGA.md`: titularidad, permisos y seguridad de cuentas.
- `AGENTS.md`: instrucciones para asistentes de programacion.

## Primer mensaje recomendado para una IA

```text
Lee AGENTS.md, README.md, ENTREGA_DANIEL.md y DOCUMENTACION_PLATAFORMA.md antes de cambiar archivos. Crea una rama nueva, no expongas secretos ni modifiques datos de produccion. Implementa solo el cambio solicitado, ejecuta npm run check, ensename el diff y prepara un pull request para revision.
```
