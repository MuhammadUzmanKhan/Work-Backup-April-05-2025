import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateExtensionReleaseDto } from './dto/create-extension-releases.dto';
import { ExtensionReleasesModal } from 'src/common/models/extension-releases.model';

@Injectable()
export class ExtensionReleasesService {

    public async getAllExtensionReleases() {
        try {
            const releases = await ExtensionReleasesModal.findAll({order: [['createdAt', 'asc']]});

            return {
                message: 'Extension releases fetched successfully',
                extensionReleases: releases
            };
        } catch (error) {
            console.error('Error while fetching extension releases', error);
        }
    }

    public async getLatestExtensionReleases() {
        try {
            const release = await ExtensionReleasesModal.findOne({ where: { isActive: true } });

            return {
                message: 'Extension release fetched successfully',
                data: release
            };
        } catch (error) {
            console.error('Error while fetching extension release', error);
        }
    }

    public async createExtensionRelease(createExtensionReleaseDto: CreateExtensionReleaseDto) {
        const { version, message, forced } = createExtensionReleaseDto;

        try {
            if (forced) {

                await ExtensionReleasesModal.update(
                    { isActive: false },
                    { where: { isActive: true } }
                );

                const release = await ExtensionReleasesModal.create({
                    version,
                    message,
                    forced,
                    isActive: true
                });

                return {
                    message: 'Extension release created successfully',
                    extensionRelease: release
                };
            } else {

                const release = await ExtensionReleasesModal.create({
                    version,
                    message,
                });

                return {
                    message: 'Extension release created successfully',
                    extensionRelease: release
                };

            }

        } catch (error) {
            console.error('Error while creating extension release', error);
        }
    }

    public async deleteExtensionRelease(id: string) {
        const release = ExtensionReleasesModal.findByPk(id);

        if (!release) {
            throw new NotFoundException('Extension release not found');
        }

        await ExtensionReleasesModal.destroy({
            where: {
                id
            }
        });

        return {
            message: 'Extension release deleted successfully'
        };

    }

    public async toggelctivateRelease({ id,
        isActive }: { id: string, isActive: boolean }
    ) {
        try {

            await ExtensionReleasesModal.update(
                { isActive: false },
                { where: { isActive: true } }
            );

            await ExtensionReleasesModal.update(
                { isActive },
                { where: { id } }
            );

            return {
                message: 'Release activated/deactivated successfully'
            };

        } catch (error) {
            console.error('Error while deactivating release', error);
        }
    }
}
