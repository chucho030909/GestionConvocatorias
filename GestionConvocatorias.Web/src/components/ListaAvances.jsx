import { FileText, Download } from 'lucide-react';
import { descargarArchivo } from '../services/api';

function formatearFecha(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function ListaAvances({ avances }) {
  return (
    <div className="space-y-3">
      {avances.map((avance) => (
        <div
          key={avance.id}
          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-gray-400">{formatearFecha(avance.fecha)}</span>
                {avance.porcentaje > 0 && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    {avance.porcentaje}%
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{avance.descripcion}</p>
              {avance.autor && (
                <p className="text-xs text-gray-400 mt-1">Por: {avance.autor}</p>
              )}
            </div>

            {avance.rutaDocumento && (
              <a
                href={descargarArchivo(avance.rutaDocumento)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs text-gray-600 transition-colors"
              >
                <FileText size={14} />
                Ver PDF
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
