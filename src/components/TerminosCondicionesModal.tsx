'use client';

import React, { useState } from 'react';
import { X, FileText, Check, AlertCircle } from 'lucide-react';

interface TerminosCondicionesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAceptar: () => void;
  yAceptados?: boolean;
}

/**
 * Modal de Términos y Condiciones
 * Debe aceptarse antes de poder avanzar de Recepción
 */
export default function TerminosCondicionesModal({
  isOpen,
  onClose,
  onAceptar,
  yAceptados = false
}: TerminosCondicionesModalProps) {
  const [aceptado, setAceptado] = useState(yAceptados);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  if (!isOpen) return null;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom = element.scrollHeight - element.scrollTop === element.clientHeight;
    if (isAtBottom) {
      setScrolledToBottom(true);
    }
  };

  const handleAceptar = () => {
    if (!aceptado) return;
    onAceptar();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Términos y Condiciones
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Team Service Costa S.A.S. - Centro Autorizado KÄRCHER
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenido */}
        <div 
          className="flex-1 overflow-y-auto p-6 space-y-6"
          onScroll={handleScroll}
        >
          {/* Advertencia */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  Importante: Debe leer y aceptar los términos para continuar
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                  Desplácese hasta el final del documento para habilitar el botón de aceptación
                </p>
              </div>
            </div>
          </div>

          {/* Términos */}
          <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 text-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              1. ACEPTACIÓN DE TÉRMINOS
            </h3>
            <p>
              Al entregar su equipo a Team Service Costa S.A.S., usted acepta los siguientes 
              términos y condiciones que rigen el servicio técnico autorizado KÄRCHER.
            </p>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6">
              2. RECEPCIÓN DEL EQUIPO
            </h3>
            <p>
              <strong>2.1.</strong> El cliente declara que el equipo entregado es de su propiedad 
              o cuenta con autorización para su reparación.
            </p>
            <p>
              <strong>2.2.</strong> Team Service Costa realizará una inspección inicial del equipo 
              para determinar su estado y las reparaciones necesarias.
            </p>
            <p>
              <strong>2.3.</strong> El cliente debe informar sobre cualquier daño previo, 
              modificación o reparación anterior realizada al equipo.
            </p>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6">
              3. DIAGNÓSTICO Y COTIZACIÓN
            </h3>
            <p>
              <strong>3.1.</strong> El diagnóstico técnico tendrá un costo de revisión que será 
              informado al cliente antes de iniciar.
            </p>
            <p>
              <strong>3.2.</strong> Una vez realizado el diagnóstico, se enviará una cotización 
              detallada al cliente con los costos de reparación.
            </p>
            <p>
              <strong>3.3.</strong> La cotización es válida por 15 días calendario. Después de 
              este período, los precios pueden variar.
            </p>
            <p>
              <strong>3.4.</strong> El cliente debe aprobar la cotización para que se proceda 
              con la reparación.
            </p>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6">
              4. REPARACIÓN
            </h3>
            <p>
              <strong>4.1.</strong> Todos los repuestos utilizados son originales KÄRCHER o 
              equivalentes de alta calidad.
            </p>
            <p>
              <strong>4.2.</strong> El tiempo estimado de reparación será informado al cliente, 
              pudiendo variar según disponibilidad de repuestos.
            </p>
            <p>
              <strong>4.3.</strong> Si durante la reparación se detectan daños adicionales, se 
              informará al cliente para su aprobación antes de proceder.
            </p>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6">
              5. GARANTÍA
            </h3>
            <p>
              <strong>5.1.</strong> Team Service Costa ofrece garantía de 90 días sobre la mano 
              de obra y repuestos utilizados en la reparación.
            </p>
            <p>
              <strong>5.2.</strong> La garantía cubre únicamente los defectos de fabricación de 
              los repuestos o errores en la reparación realizada.
            </p>
            <p>
              <strong>5.3.</strong> La garantía NO cubre:
            </p>
            <ul className="list-disc ml-6">
              <li>Daños por mal uso o negligencia del cliente</li>
              <li>Uso de repuestos no autorizados después de la reparación</li>
              <li>Reparaciones realizadas por terceros no autorizados</li>
              <li>Daños por fenómenos naturales o accidentes</li>
              <li>Desgaste normal por uso</li>
            </ul>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6">
              6. RESPONSABILIDAD
            </h3>
            <p>
              <strong>6.1.</strong> Team Service Costa no se hace responsable por la pérdida de 
              datos, información o configuraciones almacenadas en el equipo.
            </p>
            <p>
              <strong>6.2.</strong> El cliente debe retirar el equipo dentro de los 30 días 
              posteriores a la notificación de finalización.
            </p>
            <p>
              <strong>6.3.</strong> Después de 30 días sin retirar, se cobrará $5,000 diarios 
              por almacenamiento.
            </p>
            <p>
              <strong>6.4.</strong> Después de 90 días sin retirar, el equipo pasará a ser 
              propiedad de Team Service Costa para cubrir costos.
            </p>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6">
              7. PAGOS
            </h3>
            <p>
              <strong>7.1.</strong> El pago debe realizarse al momento de retirar el equipo.
            </p>
            <p>
              <strong>7.2.</strong> Se aceptan pagos en efectivo, transferencia bancaria y tarjetas 
              de crédito/débito.
            </p>
            <p>
              <strong>7.3.</strong> El equipo no será entregado hasta completar el pago total.
            </p>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6">
              8. PROTECCIÓN DE DATOS
            </h3>
            <p>
              Team Service Costa se compromete a proteger los datos personales del cliente de 
              acuerdo con la Ley 1581 de 2012. Los datos serán utilizados únicamente para la 
              gestión del servicio técnico y notificaciones relacionadas.
            </p>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6">
              9. CONTACTO
            </h3>
            <p>
              Para cualquier consulta o reclamo, puede contactarnos:
            </p>
            <ul className="list-none ml-0">
              <li>📧 Email: {process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'info@teamservicecosta.com'}</li>
              <li>📱 WhatsApp: {process.env.NEXT_PUBLIC_CONTACT_PHONE || '+57 300 123 4567'}</li>
              <li>🌐 Web: https://gleeful-mochi-2bc33c.netlify.app/</li>
            </ul>

            <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                Última actualización: Noviembre 2025<br/>
                Team Service Costa S.A.S. - Centro Autorizado KÄRCHER<br/>
                Montería, Cartagena y Apartadó
              </p>
            </div>
          </div>
        </div>

        {/* Footer con checkbox */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          <label className="flex items-start gap-3 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={aceptado}
              onChange={(e) => setAceptado(e.target.checked)}
              disabled={!scrolledToBottom}
              className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              He leído y acepto los términos y condiciones del servicio técnico. 
              Comprendo y estoy de acuerdo con las políticas de garantía, responsabilidad y pagos.
            </span>
          </label>

          {!scrolledToBottom && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-4">
              ⚠️ Debe desplazarse hasta el final del documento para habilitar la aceptación
            </p>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors
                bg-gray-100 hover:bg-gray-200 text-gray-700
                dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
            >
              Cancelar
            </button>
            <button
              onClick={handleAceptar}
              disabled={!aceptado}
              className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-colors
                bg-blue-600 hover:bg-blue-700 text-white
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              Aceptar Términos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
