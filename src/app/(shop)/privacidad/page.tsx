import type { Metadata } from 'next';
import { Title } from '@/components';

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description: 'Cómo Teslo Shop y su asistente de WhatsApp usan y protegen tus datos',
};

export default function PrivacidadPage() {
  return (
    <div className="flex justify-center mb-20 px-5 sm:px-0">
      <div className="w-full max-w-3xl">

        <Title title="Política de privacidad" subtitle="Teslo Shop y su asistente de WhatsApp" />

        <p className="mb-6 text-sm text-gray-500">
          Proyecto académico de la Universidad Nacional de Ingeniería (UNI), grupo 4S1-SIS-S.
        </p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Qué datos guardamos</h2>
          <p>Cuando escribes a nuestro número de WhatsApp guardamos en la base de datos de Teslo Shop:</p>
          <ul className="list-disc ml-6 mt-2">
            <li>Tu número de teléfono y el nombre de tu perfil de WhatsApp.</li>
            <li>Los mensajes que nos envías y las respuestas del asistente.</li>
            <li>Las reservas y pedidos que hagas: producto, talla, cantidad y estado del pago.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Para qué los usamos</h2>
          <ul className="list-disc ml-6">
            <li>Responder tus consultas sobre productos, tallas, precios y disponibilidad.</li>
            <li>Apartar productos por 15 minutos mientras completas el pago.</li>
            <li>Dar contexto al asistente con tus últimos mensajes para que la conversación sea coherente.</li>
          </ul>
          <p className="mt-2">No vendemos ni compartimos tus datos con fines publicitarios.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Servicios que intervienen</h2>
          <ul className="list-disc ml-6">
            <li><b>WhatsApp (Meta):</b> entrega los mensajes entre tú y Teslo Shop.</li>
            <li><b>n8n:</b> conecta WhatsApp con la tienda.</li>
            <li><b>Anthropic (Claude):</b> genera las respuestas del asistente a partir de tus mensajes.</li>
            <li><b>PayPal:</b> procesa los pagos. Teslo Shop no recibe ni guarda datos de tu tarjeta.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Cómo eliminar tus datos</h2>
          <p>
            Escribe &quot;eliminar mis datos&quot; al mismo número de WhatsApp de Teslo Shop. El equipo borrará tu
            conversación y tus datos de contacto en un plazo máximo de 7 días y te confirmará por el mismo medio.
            Los pedidos ya pagados se conservan solo como registro de la venta.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Cambios a esta política</h2>
          <p>Si esta política cambia, publicaremos la nueva versión en esta misma página.</p>
        </section>

      </div>
    </div>
  );
}
