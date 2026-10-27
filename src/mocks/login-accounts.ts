import type { Usuario } from '../tipos';
import { usuariosMock } from './catalogos';

export type LoginAccount = {
  email: Usuario['email'];
  password: string;
  usuario: Usuario;
};

export const loginAccounts: LoginAccount[] = usuariosMock.map((usuario) => ({
  email: usuario.email,
  password: 'demo1234',
  usuario,
}));
