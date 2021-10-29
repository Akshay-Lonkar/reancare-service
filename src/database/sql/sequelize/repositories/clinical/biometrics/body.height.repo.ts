import { Op } from 'sequelize';
import { ApiError } from '../../../../../../common/api.error';
import { Logger } from '../../../../../../common/logger';
import { BodyHeightDomainModel } from '../../../../../../domain.types/clinical/biometrics/body.height/body.height.domain.model';
import { BodyHeightDto } from '../../../../../../domain.types/clinical/biometrics/body.height/body.height.dto';
import { BodyHeightSearchFilters, BodyHeightSearchResults } from '../../../../../../domain.types/clinical/biometrics/body.height/body.height.search.types';
import { IBodyHeightRepo } from '../../../../../repository.interfaces/clinical/biometrics/body.height.repo.interface';
import { BodyHeightMapper } from '../../../mappers/clinical/biometrics/body.height.mapper';
import BodyHeight from '../../../models/clinical/biometrics/body.height.model';

///////////////////////////////////////////////////////////////////////

export class BodyHeightRepo implements IBodyHeightRepo {

    create = async (createModel: BodyHeightDomainModel): Promise<BodyHeightDto> => {
        try {
            const entity = {
                PatientUserId    : createModel.PatientUserId,
                BodyHeight       : createModel.BodyHeight,
                Unit             : createModel.Unit,
                RecordDate       : createModel.RecordDate,
                RecordedByUserId : createModel.RecordedByUserId
            };
            const bodyHeight = await BodyHeight.create(entity);
            return await BodyHeightMapper.toDto(bodyHeight);
        } catch (error) {
            Logger.instance().log(error.message);
            throw new ApiError(500, error.message);
        }
    };

    getById = async (id: string): Promise<BodyHeightDto> => {
        try {
            const bodyHeight = await BodyHeight.findByPk(id);
            return await BodyHeightMapper.toDto(bodyHeight);

        } catch (error) {
            Logger.instance().log(error.message);
            throw new ApiError(500, error.message);
        }
    };

    search = async (filters: BodyHeightSearchFilters): Promise<BodyHeightSearchResults> => {
        try {
            const search = { where: {} };

            if (filters.PatientUserId != null) {
                search.where['PatientUserId'] = filters.PatientUserId;
            }
            if (filters.MinValue != null && filters.MaxValue != null) {
                search.where['BodyHeight'] = {
                    [Op.gte] : filters.MinValue,
                    [Op.lte] : filters.MaxValue,
                };
            } else if (filters.MinValue === null && filters.MaxValue !== null) {
                search.where['BodyHeight'] = {
                    [Op.lte] : filters.MaxValue,
                };
            } else if (filters.MinValue !== null && filters.MaxValue === null) {
                search.where['BodyHeight'] = {
                    [Op.gte] : filters.MinValue,
                };
            }
            if (filters.CreatedDateFrom != null && filters.CreatedDateTo != null) {
                search.where['CreatedAt'] = {
                    [Op.gte] : filters.CreatedDateFrom,
                    [Op.lte] : filters.CreatedDateTo,
                };
            } else if (filters.CreatedDateFrom === null && filters.CreatedDateTo !== null) {
                search.where['CreatedAt'] = {
                    [Op.lte] : filters.CreatedDateTo,
                };
            } else if (filters.CreatedDateFrom !== null && filters.CreatedDateTo === null) {
                search.where['CreatedAt'] = {
                    [Op.gte] : filters.CreatedDateFrom,
                };
            }
            if (filters.RecordedByUserId !== null) {
                search.where['RecordedByUserId'] = filters.RecordedByUserId;
            }
            let orderByColum = 'BodyHeight';
            if (filters.OrderBy) {
                orderByColum = filters.OrderBy;
            }
            let order = 'ASC';
            if (filters.Order === 'descending') {
                order = 'DESC';
            }
            search['order'] = [[orderByColum, order]];

            let limit = 25;
            if (filters.ItemsPerPage) {
                limit = filters.ItemsPerPage;
            }
            let offset = 0;
            let pageIndex = 0;
            if (filters.PageIndex) {
                pageIndex = filters.PageIndex < 0 ? 0 : filters.PageIndex;
                offset = pageIndex * limit;
            }
            search['limit'] = limit;
            search['offset'] = offset;

            const foundResults = await BodyHeight.findAndCountAll(search);

            const dtos: BodyHeightDto[] = [];
            for (const address of foundResults.rows) {
                const dto = await BodyHeightMapper.toDto(address);
                dtos.push(dto);
            }

            const searchResults: BodyHeightSearchResults = {
                TotalCount     : foundResults.count,
                RetrievedCount : dtos.length,
                PageIndex      : pageIndex,
                ItemsPerPage   : limit,
                Order          : order === 'DESC' ? 'descending' : 'ascending',
                OrderedBy      : orderByColum,
                Items          : dtos,
            };

            return searchResults;
        } catch (error) {
            Logger.instance().log(error.message);
            throw new ApiError(500, error.message);
        }
    };

    update = async (id: string, updateModel: BodyHeightDomainModel): Promise<BodyHeightDto> => {
        try {
            const bodyHeight = await BodyHeight.findByPk(id);

            if (updateModel.PatientUserId != null) {
                bodyHeight.PatientUserId = updateModel.PatientUserId;
            }
            if (updateModel.BodyHeight != null) {
                bodyHeight.BodyHeight = updateModel.BodyHeight;
            }
            if (updateModel.Unit != null) {
                bodyHeight.Unit = updateModel.Unit;
            }
            if (updateModel.RecordDate != null) {
                bodyHeight.RecordDate = updateModel.RecordDate;
            }
            if (updateModel.RecordedByUserId != null) {
                bodyHeight.RecordedByUserId = updateModel.RecordedByUserId;
            }
            await bodyHeight.save();

            return await BodyHeightMapper.toDto(bodyHeight);

        } catch (error) {
            Logger.instance().log(error.message);
            throw new ApiError(500, error.message);
        }
    };

    delete = async (id: string): Promise<boolean> => {
        try {

            const result = await BodyHeight.destroy({ where: { id: id } });
            return result === 1;
        } catch (error) {
            Logger.instance().log(error.message);
            throw new ApiError(500, error.message);
        }
    };

}
