import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateAdminLotDto } from './dto/create-admin-lot.dto';
import type { UpdateAdminLotDto } from './dto/update-admin-lot.dto';

@Injectable()
export class AdminLotsService {
  constructor(private readonly prisma: PrismaService) {}

  lister(search?: string) {
    const terme = search?.trim();
    return this.prisma.raffleLot.findMany({
      where: terme
        ? {
            OR: [
              { nom: { contains: terme, mode: 'insensitive' } },
              { fournisseur: { contains: terme, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: [{ raffle: { dateTirage: 'desc' } }, { nom: 'asc' }],
      take: 100,
      include: {
        raffle: { select: { id: true, titre: true, statut: true } },
        sponsor: { select: { id: true, nom: true } },
        _count: { select: { winners: true } },
      },
    });
  }

  async detail(id: string) {
    const lot = await this.prisma.raffleLot.findUnique({
      where: { id },
      include: {
        raffle: true,
        sponsor: true,
        _count: { select: { winners: true } },
      },
    });
    if (!lot) throw new NotFoundException('Lot introuvable.');
    return lot;
  }

  async creer(dto: CreateAdminLotDto, actorId: string) {
    const raffle = await this.prisma.raffle.findUnique({
      where: { id: dto.raffleId },
      select: { id: true, statut: true },
    });
    if (!raffle) throw new NotFoundException('Tirage introuvable.');
    if (raffle.statut !== 'OUVERT')
      throw new ConflictException(
        'Un lot ne peut être ajouté qu’à un tirage ouvert.',
      );
    const lot = await this.prisma.raffleLot.create({
      data: {
        raffleId: dto.raffleId,
        nom: dto.nom,
        valeurEstimee: dto.valeurEstimee,
        quantite: dto.quantite,
        fournisseur: dto.fournisseur,
        ...(dto.sponsorId ? { sponsorId: dto.sponsorId } : {}),
      },
    });
    await this.audit(actorId, 'RAFFLE_LOT_CREATED', lot.id, {
      raffleId: dto.raffleId,
      nom: dto.nom,
      quantite: dto.quantite,
    });
    return lot;
  }

  async modifier(id: string, dto: UpdateAdminLotDto, actorId: string) {
    const current = await this.prisma.raffleLot.findUnique({
      where: { id },
      include: {
        raffle: { select: { statut: true } },
        _count: { select: { winners: true } },
      },
    });
    if (!current) throw new NotFoundException('Lot introuvable.');
    if (current.raffle.statut !== 'OUVERT' || current._count.winners > 0)
      throw new ConflictException('Ce lot n’est plus modifiable.');
    const lot = await this.prisma.raffleLot.update({
      where: { id },
      data: {
        ...(dto.nom === undefined ? {} : { nom: dto.nom }),
        ...(dto.valeurEstimee === undefined
          ? {}
          : { valeurEstimee: dto.valeurEstimee }),
        ...(dto.quantite === undefined ? {} : { quantite: dto.quantite }),
        ...(dto.fournisseur === undefined
          ? {}
          : { fournisseur: dto.fournisseur }),
        ...(dto.sponsorId === undefined ? {} : { sponsorId: dto.sponsorId }),
      },
    });
    await this.audit(actorId, 'RAFFLE_LOT_UPDATED', id, { changes: dto });
    return lot;
  }

  async supprimer(id: string, actorId: string) {
    const current = await this.prisma.raffleLot.findUnique({
      where: { id },
      include: {
        raffle: { select: { statut: true } },
        _count: { select: { winners: true } },
      },
    });
    if (!current) throw new NotFoundException('Lot introuvable.');
    if (current.raffle.statut !== 'OUVERT' || current._count.winners > 0)
      throw new ConflictException('Ce lot ne peut pas être supprimé.');
    await this.prisma.raffleLot.delete({ where: { id } });
    await this.audit(actorId, 'RAFFLE_LOT_DELETED', id, { nom: current.nom });
    return { id, deleted: true };
  }

  private audit(
    actorId: string,
    action: string,
    entityId: string,
    metadata: object,
  ) {
    return this.prisma.contentAuditEvent.create({
      data: { actorId, action, entityType: 'RaffleLot', entityId, metadata },
    });
  }
}
