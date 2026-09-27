import { InternalServerErrorException } from '@nestjs/common';

/** Convertit une erreur interne en réponse API générique sans détail technique. */
export function erreurInterne(): InternalServerErrorException {
  return new InternalServerErrorException('Internal server error.');
}
