# Descripción



## Correr en dev


1. Clonar el repositorio.
2. Crear una copia del ```.env.template``` y renombrarlo a ```.env``` y cambiar las variables de entorno.
3. Instalar dependencias ```npm install```
4. Levantar la base de datos ```docker compose up -d```
5. Correr las migraciones de Primsa ```npx prisma migrate dev```
6. Ejecutar seed ```npm run seed```
7. Correr el proyecto ```npm run dev```
8. Limpiar el localStorage del navegador.   


## Pruebas de la API del bot (WhatsApp / n8n)

Requieren la base de datos local y el proyecto corriendo (`npm run dev`), y `BOT_API_KEY` definida en el `.env`.

```
npm run test:bot
```

- `tests/bot-api.test.js`: mensajes, duplicados, búsqueda, stock y vencimiento de reservas.
- `tests/concurrency.test.js`: varios clientes reservando la misma unidad al mismo tiempo; solo uno la obtiene y nunca hay sobreventa.

Las pruebas solo se ejecutan si `DATABASE_URL` apunta a `localhost` y borran los datos que crean al terminar.




## Correr en prod