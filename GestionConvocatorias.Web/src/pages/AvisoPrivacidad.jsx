import { Link } from 'react-router-dom';
import { Shield, FileText, User, Mail, Database, Clock } from 'lucide-react';

export default function AvisoPrivacidad() {
  const secciones = [
    {
      icon: <Shield className="text-blue-600" size={20} />,
      titulo: '¿Qué información recopilamos?',
      contenido: [
        'Recopilamos la información que nos proporcionas directamente al registrarte, incluyendo: correo institucional, nombre(s), apellidos, matrícula, datos de nacimiento, contacto (correo personal y teléfono), y datos académicos (universidad, división, programa, cuatrimestre, grupo, promedio, modalidad).',
        'También recopilamos los archivos PDF que subas (identificación oficial, constancia de estudios y carta compromiso) con el fin de validar tu situación académica.',
      ],
    },
    {
      icon: <Database className="text-green-600" size={20} />,
      titulo: '¿Para qué usamos tu información?',
      contenido: [
        'Tu información se utiliza exclusivamente para: crear y gestionar tu cuenta de usuario; inscribirte en convocatorias y registrar tus proyectos; notificarte sobre el estado de tu participación, evaluaciones y resultados; y cumplir con los requisitos académicos de la institución.',
        'Los archivos subidos se almacenan de forma segura y solo se usan para validación institucional.',
      ],
    },
    {
      icon: <User className="text-purple-600" size={20} />,
      titulo: '¿Con quién compartimos tu información?',
      contenido: [
        'Tu información será tratada de manera confidencial y no se comparte con terceros sin tu consentimiento, salvo que sea requerido por autoridades competentes o por la propia universidad con fines académicos.',
      ],
    },
    {
      icon: <Mail className="text-red-600" size={20} />,
      titulo: '¿Cómo podemos contactarte?',
      contenido: [
        'Podemos enviarte notificaciones a tu correo institucional y/o correo personal registrado. Puedes retirar el consentimiento en cualquier momento enviando un correo a soporte@convocaeval.mx.',
      ],
    },
    {
      icon: <Clock className="text-amber-600" size={20} />,
      titulo: '¿Cuánto tiempo conservamos tus datos?',
      contenido: [
        ' Conservamos tus datos durante el tiempo necesario para cumplir con las finalidades descritas y mientras mantengas una cuenta activa, o cuando sea necesario para fines legales.',
      ],
    },
    {
      icon: <FileText className="text-gray-600" size={20} />,
      titulo: 'Cambios a este aviso de privacidad',
      contenido: [
        'Nos reservamos el derecho de actualizar este aviso de privacidad. Cualquier cambio será publicado en la aplicación antes de que entre en vigor.',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="text-blue-600" size={32} />
            <h1 className="text-3xl font-bold text-gray-900">
              Aviso de Privacidad ConvocaEval IA
            </h1>
          </div>
          <p className="text-sm text-gray-500">
            Última actualización: {new Date().toLocaleDateString('es-MX')}
          </p>
        </div>

        <div className="space-y-6">
          {secciones.map((seccion, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                {seccion.icon}
                <h2 className="text-lg font-semibold text-gray-800">
                  {seccion.titulo}
                </h2>
              </div>
              <div className="space-y-2">
                {seccion.contenido.map((p, j) => (
                  <p key={j} className="text-gray-600 leading-relaxed">
                    {p.trim()}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/register"
            className="inline-block bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Regresar al registro
          </Link>
        </div>
      </div>
    </div>
  );
}
