import { createContext, useContext, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

const NAME_IDENTIFIER =
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';
const EMAIL =
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress';
const NAME =
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';
const ROLE =
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

const ROLES = {
  ADMINISTRADOR: 'Administrador',
  COORDINADOR: 'Coordinador',
  DOCENTE_ASESOR: 'DocenteAsesor',
  ESTUDIANTE: 'Estudiante',
  EVALUADOR: 'Evaluador',
};

function obtenerUsuarioDesdeToken(token) {
  if (!token) return null;
  try {
    const payload = jwtDecode(token);

    const rolReclamado =
      payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
      payload.role ||
      payload.Role;

    const role = rolReclamado instanceof Array ? rolReclamado[0] : rolReclamado;

    return {
      id: payload[NAME_IDENTIFIER],
      email: payload[EMAIL],
      name: payload[NAME],
      role,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    return obtenerUsuarioDesdeToken(token);
  });

  const login = (token) => {
    localStorage.setItem('token', token);
    setUser(obtenerUsuarioDesdeToken(token));
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export { ROLES };
export default AuthContext;
