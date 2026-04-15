# Desarrollo Móvil con Expo

Este documento explica cómo configurar y usar la aplicación web de Nursing Care en dispositivos móviles usando Expo.

## Problema: Acceso desde Dispositivos Móviles

Cuando desarrollas en tu computadora local y quieres acceder a la aplicación desde un dispositivo móvil en la misma red, el dispositivo móvil no puede acceder a `localhost:8080` porque `localhost` se refiere al propio dispositivo, no a tu computadora.

### Solución

Usa la IP local de tu red en lugar de `localhost`. La IP de tu computadora en la red local es **10.0.0.34**.

## Configuración para Desarrollo Móvil

### Opción 1: Usar el archivo .env.mobile (Recomendado)

Ya se ha creado un archivo `.env.mobile` con la configuración correcta:

```bash
# .env.mobile
VITE_API_BASE_URL=http://10.0.0.34:8080/api
```

Para usar este archivo, renómbralo o copia su contenido a `.env.development.local`:

```bash
# Desde el directorio nursing_care_web_react
cp .env.mobile .env.development.local
```

### Opción 2: Modificar manualmente .env.development.local

Edita el archivo `.env.development.local` y configura:

```bash
VITE_API_BASE_URL=http://10.0.0.34:8080/api
```

**IMPORTANTE:** No uses rutas relativas como `/api` cuando accedas desde dispositivos móviles, porque el proxy de Vite no funciona fuera de localhost:3000.

## Verificar la IP de tu Computadora

Si tu IP local cambia, puedes verificarla con:

```bash
# En macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# O específicamente para la interfaz de red
ipconfig getifaddr en0  # WiFi en macOS
```

## Iniciar el Servidor de Desarrollo

1. **Inicia el backend** en tu computadora (debe estar accesible en `http://10.0.0.34:8080`)

2. **Inicia el servidor de Vite:**

```bash
npm start
```

El servidor de Vite estará disponible en:
- Computadora local: `http://localhost:3000`
- Desde dispositivos móviles: `http://10.0.0.34:3000`

## Acceder desde Expo

### Opción 1: Navegador del Dispositivo Móvil

Simplemente abre el navegador en tu dispositivo móvil y accede a:

```
http://10.0.0.34:3000
```

### Opción 2: Expo WebView (si usas Expo)

Si tienes una app de Expo que carga la web, configura la WebView para que apunte a:

```
http://10.0.0.34:3000
```

## Solución de Problemas

### Error: "No se puede conectar" o "ERR_CONNECTION_REFUSED"

1. **Verifica que el backend esté corriendo:**
   ```bash
   curl http://10.0.0.34:8080/api/health
   # O desde tu navegador
   ```

2. **Verifica que el firewall permita conexiones:**
   - En macOS, ve a Configuración del Sistema > Red > Firewall
   - Asegúrate de que tu aplicación Java/Spring Boot tenga acceso

3. **Verifica que estés en la misma red WiFi:**
   - Tu computadora y dispositivo móvil deben estar en la misma red local

### El DatePicker no aparece

Si el DatePicker no se muestra:

1. **Verifica la consola del navegador** para errores de JavaScript
2. **Asegúrate de que las dependencias estén instaladas:**
   ```bash
   npm install @mui/x-date-pickers dayjs
   ```
3. **Limpia la caché del navegador** o prueba en modo incógnito

### Cambios no se reflejan

Si haces cambios y no se ven en el dispositivo móvil:

1. **Limpia la caché del navegador** en el dispositivo móvil
2. **Haz un hard refresh:** Fuerza la recarga de la página
3. **Reinicia el servidor de Vite:**
   ```bash
   npm start
   ```

## Notas Importantes

### No Subir .env.development.local a Git

El archivo `.env.development.local` es específico de tu máquina y no debe subirse al repositorio. Ya está incluido en `.gitignore`.

### Para Producción

Esta configuración es **solo para desarrollo local**. En producción, usa:
- Variables de entorno apropiadas para el entorno de producción
- URLs absolutas o relativas según la arquitectura de despliegue
- HTTPS en lugar de HTTP

## Configuración del DatePicker

El DatePicker ahora está configurado a nivel global en `App.tsx` con:

```tsx
<LocalizationProvider dateAdapter={AdapterDayjs}>
  {/* Tu aplicación */}
</LocalizationProvider>
```

Esto significa que todos los componentes `FormDatePicker` automáticamente:
- Se adaptan a móvil/desktop
- Usan formato de fecha YYYY-MM-DD
- Muestran el calendario en el idioma configurado

## Componente FormDatePicker

El componente `FormDatePicker` está en `src/components/common/FormDatePicker.tsx` y se usa así:

```tsx
<FormDatePicker
  label="Fecha del servicio"
  value={dateState}
  onChange={setDateState}
  fullWidth
  disabled={isLoading}
  slotProps={{
    textField: {
      helperText: "Texto de ayuda aquí"
    }
  }}
/>
```

## Resumen

Para desarrollo móvil:

1. ✅ Copia `.env.mobile` a `.env.development.local`
2. ✅ Verifica que tu backend esté en `http://10.0.0.34:8080`
3. ✅ Inicia el servidor con `npm start`
4. ✅ Accede desde tu móvil a `http://10.0.0.34:3000`
5. ✅ El DatePicker funcionará automáticamente en móvil y desktop
