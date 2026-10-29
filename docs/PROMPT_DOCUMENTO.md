# Prompt para generar el informe final

> Uso: abre un chat nuevo con Claude, **adjunta los dos PDFs** ("Planteamiento-del-Problema-y-Justificacion-TeslaShop-WhatsApp.pdf" y "Guia_Estructura_Proyecto_Chatbot.pdf") y pega todo lo que está debajo de la línea.

---

Eres un redactor técnico-académico. Necesito el **informe final** de un proyecto universitario de Inteligencia Artificial: un chatbot de ventas por WhatsApp.

## Documentos adjuntos
1. **Guía del docente** ("Guía de Estructura de Proyectos – Chatbot / Agente Conversacional"). Define las 21 secciones obligatorias, el formato y los criterios de evaluación. **Es la rúbrica: síguela al pie de la letra.**
2. **Avance del equipo** ("Planteamiento del Problema y Justificación"). Ya contiene contexto, situación problemática, planteamiento, problema central, causas, consecuencias, árbol de problemas, justificación (práctica, tecnológica, operativa y organizacional), beneficiarios, relación problema-solución y aspectos por validar.

## Qué debes entregar
Redacta el informe completo con las **21 secciones obligatorias de la guía, en su orden y numeradas**:

1. Portada
2. Índice
3. Resumen ejecutivo (150–250 palabras)
4. Introducción
5. Planteamiento del problema
6. Objetivos
7. Justificación
8. Marco teórico y estado del arte
9. Diseño conversacional
10. Metodología
11. Datos / corpus
12. Preprocesamiento de texto
13. Arquitectura del sistema
14. Implementación
15. Pruebas y evaluación
16. Resultados
17. Discusión y limitaciones
18. Conclusiones
19. Recomendaciones y trabajo futuro
20. Referencias (APA 7)
21. Anexos

Al final agrega:
- **Lista de figuras y tablas** que el equipo debe capturar o insertar, numeradas, con título y fuente, como exige la guía.
- **Tabla de cumplimiento de la rúbrica**: cada componente de la sección 5 de la guía (Documentación 25 %, Diseño conversacional y NLU 20 %, Código/arquitectura 25 %, Evaluación y pruebas 15 %, Demo 15 %) y cada buena práctica de la sección 3.3 → dónde se cubre → estado (cubierto / parcial / pendiente).
- **Lista de pendientes** que el equipo debe completar antes de entregar.

## Reglas de redacción (muy importantes)
- Español formal y académico, en impersonal o primera persona del plural.
- **Reutiliza el avance:** las secciones 4, 5 y 7 deben basarse en el PDF del equipo. Resúmelo y adáptalo; no lo contradigas.
- **No inventes resultados, cifras, encuestas ni funcionalidades.** Usa solo los datos de este prompt. Si una métrica no existe todavía, deja la tabla con `[PENDIENTE: valor]` y explica cómo se medirá.
- **Sé honesto con el alcance:** el avance prometía cosas que no se implementaron (ver "Diferencias entre el avance y lo implementado"). Preséntalas como decisiones de alcance o trabajo futuro, con su justificación. Nunca las presentes como hechas.
- Respeta la sección "Aspectos que deben validarse" del avance: no presentes como estadísticas datos del negocio que no existen.
- Marca las imágenes así: `[Figura N: descripción — Fuente: elaboración propia]`.
- Usa diagramas Mermaid para la arquitectura, el flujo de diálogo y la secuencia de concurrencia.
- Siempre que describas algo implementado, referencia el archivo del repositorio, como pide la sección 4 de la guía (por ejemplo: "ver `src/lib/bot/reservations.ts`").
- Extensión objetivo: entre 15 y 30 páginas sin anexos.

## Datos de portada
- Universidad Nacional de Ingeniería (UNI), Recinto Universitario Simón Bolívar.
- Asignatura: Inteligencia Artificial. Grupo: 4S1-SIS-S. Docente: Ing. Martin Loza.
- **Título:** Sistema de Ventas Automatizado por WhatsApp integrado a TeslaShop mediante n8n.
- **Estudiantes:**
  - Fernando José Gutiérrez Parrales (2023-0268I)
  - Elsa Junieth Navarrete Torres (2023-0809I)
  - Mariana Lucia Zepeda Membreño (2023-0222I)
  - Carlos Alexander García Guevara (23-30013SU)
  - Ali Javier Hurtado Rodriguez (2020-1234U)
- **Fecha de entrega:** 29/10/2026.

## Contexto técnico (fuente de verdad para las secciones 8 a 21)

### Sistema base
TeslaShop está construida con:
- Next.js 14 (App Router, TypeScript), Prisma ORM y PostgreSQL en Neon (AWS us-east-1);
- NextAuth y Cloudinary.

Está desplegada en Vercel: https://proyecto-phi-wine.vercel.app
- Repositorio: https://github.com/ALEXDEVELOPS12/proyecto (es el que está conectado a Vercel y desplegado).
- Video de demo: `[PENDIENTE]`.

### Tipo de chatbot y enfoque técnico
- **Chatbot generativo basado en LLM con herramientas (tool calling / function calling)**, también llamado *agente conversacional*. No es RAG vectorial: en lugar de embeddings y búsqueda semántica, el modelo consulta datos **estructurados y en tiempo real** (catálogo y stock en PostgreSQL) mediante herramientas que llaman a una API. Esto se conoce como *tool-augmented generation*.
- **Modelo:** Claude Haiku 4.5 de Anthropic (`claude-haiku-4-5`), usado mediante el nodo AI Agent de n8n (basado en LangChain). Se eligió por bajo costo, baja latencia y buen soporte de herramientas.
- **Orquestador:** n8n Cloud.
- **Canal:** WhatsApp Cloud API de Meta (app "TeslaShop Bot", publicada; número de prueba +1 555 143 4400).
- **Principio de arquitectura: "n8n conversa, TeslaShop decide".**
  - El LLM y n8n nunca acceden directamente a la base de datos.
  - Toda lectura o escritura pasa por una API REST propia (`/api/bot/*`) protegida con el header `x-api-key`, que se compara con `timingSafeEqual`.
  - Las reglas críticas (stock, reservas, vencimiento, idempotencia) se ejecutan en el servidor, así que el LLM no puede sobrevender aunque se equivoque.
  - Esto cumple la justificación tecnológica del avance: una única fuente de verdad.

### Cómo se mapean NLU, gestor de diálogo y NLG (para las secciones 9, 12 y 13)
| Componente de la guía | Implementación en este proyecto |
|---|---|
| **NLU** (intención y entidades) | Lo hace el LLM a partir del System Message y de las descripciones de las herramientas. Detecta la intención (consultar catálogo, pedir talla, confirmar reserva, fuera de alcance…) y extrae entidades (producto, talla, cantidad). No hay clasificador entrenado: es un enfoque *zero-shot* con instrucciones. |
| **Gestor de diálogo** (estado y contexto) | Estado persistente en PostgreSQL: tabla `Conversation` (una por teléfono, estado active/escalated/closed) y `ChatMessage` (historial). En cada turno se envían los **últimos 10 mensajes** como contexto. Las transiciones de negocio (reservada → confirmada / vencida) viven en `StockReservation`. |
| **NLG** (respuesta) | Generada por el LLM con restricciones del System Message: español, breve, un emoji como máximo, sin Markdown (WhatsApp no lo muestra), negritas con un solo asterisco. |
| **Recuperación** | Herramienta `buscar_productos` → `GET /api/bot/products?q=`: búsqueda en título, slug y etiquetas, insensible a mayúsculas, máximo 5 resultados, con stock disponible calculado. |
| **Integración con el canal** | n8n: nodos WhatsApp Trigger y WhatsApp Send, con webhook de Meta. |

### Flujo del workflow en n8n (versión publicada v2.1)
1. **WhatsApp Trigger:** recibe el mensaje (webhook de Meta).
2. **¿Es texto?** (nodo If): descarta avisos de estado (sent/delivered/read) y mensajes que no son texto.
3. **Guardar mensaje (inbound):** `POST /api/bot/messages`. Guarda el mensaje (deduplicado por `waMessageId`) y devuelve los últimos 10 como historial.
4. **AI Agent** (Claude Haiku 4.5):
   - **System Message:** versionado en `prompts/system_prompt.md`.
   - **Prompt de usuario:** teléfono del cliente, ID del mensaje y conversación reciente formateada como "Cliente: … / Asistente: …".
   - **Herramienta `buscar_productos`** (GET /products). Su descripción indica traducir al inglés, porque el catálogo está en inglés (sudadera → hoodie, camiseta → shirt).
   - **Herramienta `reservar`** (POST /reservations). Claude decide `productId`, `size` y `quantity`; el **teléfono y la clave de idempotencia los fija n8n** a partir del mensaje real (medida de seguridad contra suplantación y duplicados). La opción "Never Error" deja que el LLM lea los rechazos (409 out_of_stock con `available`, 422 invalid_size, 404 not_found).
5. **Guardar respuesta (outbound):** `POST /api/bot/messages` con `direction = outbound`.
6. **Send message:** envía la respuesta por WhatsApp.

### Reglas del System Message (resumen, para el diseño conversacional y el manejo de fallback)
- Alcance **SÍ**: catálogo, precios, tallas, disponibilidad y reservas.
- Alcance **NO**: soporte técnico, temas personales, otros negocios. En esos casos responde con cortesía que solo atiende temas de la tienda (**fallback controlado**).
- **Nunca inventar** productos, precios, tallas ni stock. Llamar a `buscar_productos` en cada turno que mencione productos, porque el stock cambia.
- Si una herramienta falla, decirlo con honestidad y pedir que lo intente más tarde (fallback ante errores).
- Confirmar producto, talla y cantidad antes de reservar. Reservar solo con confirmación explícita. Máximo 10 unidades.
- Tallas válidas: XS–XXXL. Si no hay la talla pedida, ofrecer las disponibles.
- Al reservar, avisar siempre: "Tienes 15 minutos para completar el pago (hasta las HH:MM)…".
- Si `out_of_stock`, explicar que otro cliente apartó la unidad y ofrecer alternativas.
- Nunca pedir datos de tarjeta, contraseñas ni documentos.
- Atender "eliminar mis datos" (plazo de 7 días).

### Intenciones y entidades (para la sección 9; el modelo las resuelve sin entrenamiento)
- **Intenciones:**
  - saludo;
  - consultar_catalogo ("¿qué sudaderas tienen?");
  - consultar_disponibilidad_talla ("¿la tienen en M?");
  - seleccionar_producto ("quiero la 3D Wordmark en talla S");
  - confirmar_reserva ("sí, apártala");
  - eliminar_datos;
  - fuera_de_alcance.
- **Entidades:** producto (nombre o tipo), talla (XS–XXXL), cantidad (1–10).
- Escribe ejemplos de frases por intención y el flujo de diálogo como diagrama.

### Datos / corpus (sección 11)
- No hay corpus de entrenamiento ni fine-tuning: el modelo es preentrenado y se guía por instrucciones (*prompting*).
- La **fuente de conocimiento** es el catálogo real de TeslaShop en PostgreSQL:
  - productos de ropa con título en inglés, precio, tallas, género, etiquetas e inventario;
  - etiquetas en el seed: shirt (41), hoodie (7), hats (2), sweatshirt (1), jacket (1).
- Se consulta en vivo, así que siempre está actualizado. No es un dataset con licencia externa: es el catálogo propio de la tienda.
- **Historial conversacional:** tablas `Conversation` y `ChatMessage`. Sirve como registro (logging), una de las buenas prácticas exigidas.

### Preprocesamiento de texto (sección 12)
- No hay tokenización ni embeddings propios: el LLM procesa el texto directamente.
- **Normalización aplicada:**
  - el LLM traduce y normaliza los términos de búsqueda del español al inglés;
  - la API busca sin distinguir mayúsculas y convierte espacios en "_" para comparar con el slug;
  - la talla se valida contra un enum;
  - las entradas se validan con **Zod**: longitudes, UUID, cantidad entera 1–10;
  - se filtran los mensajes que no son texto;
  - se deduplica por `waMessageId`.
- Hora local con `Intl.DateTimeFormat` en zona America/Managua.

### Modelo de datos (migración `prisma/migrations/20261026120000_whatsapp_bot`)
- `Product.reserved`: unidades apartadas. Disponible = `inStock - reserved`. Tiene `CHECK reserved >= 0`.
- `StockReservation`: cantidad, talla, estado (active/confirmed/expired/cancelled), `expiresAt`, `idempotencyKey` único; relación con producto, conversación y orden. `CHECK quantity > 0`.
- `Conversation`: teléfono único, nombre de perfil, estado.
- `ChatMessage`: dirección inbound/outbound, texto, `waMessageId` único, intención opcional y fecha.
- `Order`: nuevos campos `channel` (web/whatsapp), `idempotencyKey` único, `customerPhone`, `conversationId`; `userId` ahora opcional.
- La tienda web también descuenta lo reservado (`src/actions/order/place-order.ts`).

### Respuestas a las observaciones del docente en la defensa anterior (destacar en implementación y resultados)
**1. ¿Qué pasa si dos personas reservan la última unidad al mismo tiempo?**
- Se usa un UPDATE condicional atómico: `UPDATE "Product" SET reserved = reserved + q WHERE id = ? AND "inStock" - reserved >= q`.
- PostgreSQL bloquea la fila: la primera solicitud gana (HTTP 201) y las demás reciben 409 con las unidades restantes.
- La reserva dura 15 minutos + 2 de gracia. Se libera de forma perezosa en la siguiente lectura o reserva, sin cron, a costo cero.
- **Idempotencia:** el ID del mensaje de WhatsApp es la clave única. Un reenvío no aparta otra unidad.
- Código: `src/lib/bot/reservations.ts`, `src/app/api/bot/reservations/route.ts`.

**2. ¿Dónde se almacena la conversación?**
- En PostgreSQL (Neon), tablas `Conversation` y `ChatMessage`, ambos lados de la conversación.
- Política de privacidad pública: https://proyecto-phi-wine.vercel.app/privacidad (`src/app/(shop)/privacidad/page.tsx`).

### API del bot (`src/app/api/bot/`, requiere `x-api-key`)
| Endpoint | Función | Respuestas |
|---|---|---|
| `POST /messages` | Guarda un mensaje y devuelve el historial (10) | 200; `duplicate:true` si se repite |
| `GET /products?q=` | Búsqueda de productos (máx. 5) con disponible | 200 |
| `GET /stock?productId \| slug` | Disponibilidad | 200/400/404 |
| `POST /reservations` | Reserva de 15 min | 201 / 200 duplicada / 409 / 422 / 404 / 400 |
| `GET /reservations/:id` | Estado y hora local de vencimiento | 200/404 |

### Estructura del repositorio y equivalencias con la guía (sección 3.1)
El proyecto usa TypeScript/Next.js, no Python. Explica estas equivalencias:

| Guía | Proyecto |
|---|---|
| `requirements.txt` | `package.json` y `package-lock.json` |
| `.env.example` | `.env.template` (sin valores reales; incluye `BOT_API_KEY`) |
| `src/nlu`, `src/dialogue`, `src/nlg` | Lógica conversacional en el workflow de n8n y en `prompts/system_prompt.md`; estado y reglas en `src/lib/bot/` (`config.ts`, `auth.ts`, `reservations.ts`) |
| `src/retrieval` | `src/app/api/bot/products` y `stock` |
| `src/integrations` | `src/app/api/bot/*` y el workflow de n8n (WhatsApp Trigger/Send) |
| `prompts/system_prompt.md` | existe y está versionado en Git |
| `tests/` | `tests/bot-api.test.js`, `tests/concurrency.test.js`, `tests/helpers.js` (`npm run test:bot`) |
| `evaluation/` | `[PENDIENTE]` `test_conversations.json` y `metrics_report.md` |
| `reports/` | `[PENDIENTE]` figuras e informe |
| `.gitignore` | excluye `.env`; las claves viven en Vercel (Secret) y en las credenciales de n8n |

### Pruebas y evidencia real (secciones 15 y 16)
**Pruebas automatizadas** (`node --test`, 8 de 8 aprobadas):
- API: 401 sin clave, guardado y deduplicación de mensajes, historial cronológico, búsqueda, stock, reserva, idempotencia, vencimiento con liberación de la unidad, errores 400/404/422.
- **Concurrencia:**
  - 2 clientes con 1 unidad → [201, 409];
  - 10 clientes con 1 unidad → 1 éxito y 9 rechazos 409;
  - 10 clientes con 3 unidades → exactamente 3 éxitos, sin sobreventa (`reserved` nunca supera `inStock`).

**Idempotencia en producción:** la misma reserva enviada dos veces devolvió `duplicate:false` y luego `duplicate:true`, con el mismo ID de reserva (04e32462…), sin apartar otra unidad.

**Conversación de punta a punta por WhatsApp** (28/10/2026, caso exitoso):
1. "Que sudaderas tienen?" → listó 4 sudaderas reales con precio y tallas (3D Large Wordmark Pullover Hoodie $70; Men's Raven Lightweight Hoodie $115; Women's Raven Slouchy Crew Sweatshirt $110; Women's Chill Half Zip Cropped Hoodie $130).
2. "Quiero la 3D wordmark en talla S" → confirmó producto, talla y precio, y pidió confirmación.
3. "Si" → reservó y respondió "Tienes 15 minutos para completar el pago (hasta las 08:20 p. m.)…".

**Casos límite observados durante el desarrollo** (útiles para discusión y fallback):
- Sin herramientas conectadas, el modelo **inventó** variedad de productos. Con el System Message sin herramientas, respondió con honestidad "no tengo acceso al inventario".
- Con herramientas, a veces reutilizó datos del historial sin volver a consultar. Se corrigió con la regla de consultar en cada turno.
- Al principio usaba Markdown con `#` y `**`, que se ve mal en WhatsApp. Se corrigió en el prompt.

**Métricas operativas medidas en n8n:**
- Latencia por mensaje de 3 a 7 s aproximadamente (ejecuciones de 3.2 s a 6.7 s).
- Unos 1,800 tokens por llamada al modelo; 2 llamadas cuando usa una herramienta.

**Métricas de la guía aún NO medidas** (dejar como `[PENDIENTE]` y proponer el método):
- exactitud de intención;
- tasa de éxito de tarea;
- satisfacción de usuarios (por ejemplo, encuesta de 1 a 5 a compañeros de clase);
- tasa de fallback correcto ante preguntas fuera de alcance.

Propón un conjunto de 15 a 20 diálogos de prueba para `evaluation/test_conversations.json`, que incluya casos exitosos, talla inexistente, producto inexistente, sin stock, mensaje duplicado, fuera de alcance y eliminar datos. Incluye también la tabla de resultados que el equipo debe llenar.

### Costos (enfoque de bajo costo)
- WhatsApp Cloud API con número de prueba: gratis (máximo 5 destinatarios verificados).
- n8n Cloud: prueba de 14 días con 1000 ejecuciones. El workflow se exporta a JSON.
- Claude Haiku 4.5: el modelo de menor costo, fracciones de centavo por mensaje.
- Vercel Hobby y Neon gratuito.
- Las reservas vencen sin cron.

### Seguridad y privacidad
- Credenciales fuera del código: Vercel (Secret), credenciales de n8n y `.env` local en `.gitignore`.
- La credencial de n8n solo puede llamar al dominio de la tienda.
- Token permanente de WhatsApp mediante un usuario del sistema de Meta, con permisos mínimos.
- Validación con Zod.
- El LLM no controla el teléfono ni la idempotencia.
- Política de privacidad pública y canal para eliminar datos.
- Las capturas del informe no deben mostrar tokens.

### Problemas encontrados y soluciones (para la sección 17 y lecciones aprendidas)
- Meta bloqueó la cuenta de WhatsApp creada con una cuenta de Facebook nueva (error 131031). Se resolvió con una cuenta con historial.
- Con la app de Meta en modo desarrollo, los mensajes reales no llegaban al webhook. Se publicó la app usando la política de privacidad.
- La cuenta de WhatsApp estaba suscrita solo a una app interna de pruebas de Meta. Se suscribió la app propia con `POST /{WABA_ID}/subscribed_apps` (Graph API).
- El token temporal de 24 h dejaba al bot sin responder. Se cambió por un token permanente.
- La cuenta inicial de n8n quedó vinculada a la URL de prueba del webhook. Se publicó el workflow para usar la de producción.

### Diferencias entre el avance y lo implementado (presentar con honestidad)
| Prometido en el avance | Estado real | Cómo presentarlo |
|---|---|---|
| SKU por variante (talla/color) | **No implementado.** El stock es por producto; la reserva guarda la talla pero descuenta del total. Se descartó para no modificar el admin ni la tienda web existentes. | Limitación y trabajo futuro |
| Historial de movimientos de inventario | **Parcial:** `StockReservation` registra cada apartado y su estado, pero no hay un libro de movimientos general | Parcial y trabajo futuro |
| Eventos por cambio de estado del pedido | **No implementado** | Trabajo futuro |
| Factura automática vinculada al pedido | **No implementado** | Trabajo futuro |
| Idempotencia | **Implementada** en reservas y mensajes; `Order.idempotencyKey` existe en el esquema | Cumplido |
| Validación de stock antes de confirmar | **Implementada** (UPDATE atómico + reserva temporal) | Cumplido |
| API interna consumida por n8n | **Implementada** | Cumplido |
| Escalamiento a humano | El estado `escalated` existe en el modelo, pero no hay flujo de escalamiento | Trabajo futuro |

### PENDIENTE (no presentar como terminado)
- Vista de conversaciones en el panel de administración.
- `evaluation/test_conversations.json`, `evaluation/metrics_report.md` y métricas con usuarios reales.
- Exportar el JSON del workflow de n8n al repositorio.
- README completo del bot (instalación, variables, ejecución).
- Video de demostración: lo graba el equipo con el guion de `docs/GUION_VIDEO.md`; `[PENDIENTE: enlace]`.

### Referencias sugeridas (completar en APA 7)
Documentación oficial de:
- WhatsApp Cloud API (Meta for Developers);
- n8n (AI Agent, HTTP Request Tool);
- Anthropic (Claude, tool use);
- Next.js, Prisma, PostgreSQL (transacciones y bloqueo de filas, UPDATE condicional);
- Vercel, Neon, Zod.

Agrega también literatura base de NLP/chatbots: Jurafsky & Martin, *Speech and Language Processing*; Lewis et al. (2020) sobre RAG; Yao et al. (2023) sobre ReAct / agentes con herramientas.

**No inventes URL ni años:** si no estás seguro de un dato, márcalo `[VERIFICAR]`.
