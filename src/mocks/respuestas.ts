import type { Reporte, RespuestaError, RespuestaExitosa } from '../tipos';

export const listaVaciaMock: RespuestaExitosa<Reporte> = {
  datos: [],
  meta: { total: 0, pagina: 1, porPagina: 20 },
};

export const errorDeRedMock: RespuestaError = {
  error: {
    codigo: 'ERROR_RED',
    mensaje: 'No se pudo conectar. Intente nuevamente cuando vuelva la conexión.',
  },
};

export const errorFotoRequeridaMock: RespuestaError = {
  error: { codigo: 'FOTO_REQUERIDA', mensaje: 'El reporte necesita al menos una foto.' },
};
