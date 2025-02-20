import { Op } from 'sequelize';
import { ApiError } from '../../../../../../common/api.error';
import { Logger } from '../../../../../../common/logger';
import { BloodPressureDomainModel } from "../../../../../../domain.types/clinical/biometrics/blood.pressure/blood.pressure.domain.model";
import { BloodPressureDto } from "../../../../../../domain.types/clinical/biometrics/blood.pressure/blood.pressure.dto";
import { BloodPressureSearchFilters, BloodPressureSearchResults } from "../../../../../../domain.types/clinical/biometrics/blood.pressure/blood.pressure.search.types";
import { IBloodPressureRepo } from '../../../../../repository.interfaces/clinical/biometrics/blood.pressure.repo.interface';
import { BloodPressureMapper } from '../../../mappers/clinical/biometrics/blood.pressure.mapper';
import BloodPressureModel from '../../../models/clinical/biometrics/blood.pressure.model';

///////////////////////////////////////////////////////////////////////

export class BloodPressureRepo implements IBloodPressureRepo {

    create = async (createModel: BloodPressureDomainModel):
    Promise<BloodPressureDto> => {
        try {
            const entity = {
                PatientUserId    : createModel.PatientUserId,
                Systolic         : createModel.Systolic,
                Diastolic        : createModel.Diastolic,
                Unit             : createModel.Unit,
                RecordDate       : createModel.RecordDate,
                RecordedByUserId : createModel.RecordedByUserId
            };

            const bloodPressure = await BloodPressureModel.create(entity);
            return await BloodPressureMapper.toDto(bloodPressure);
        } catch (error) {
            Logger.instance().log(error.message);
            throw new ApiError(500, error.message);
        }
    };

    getById = async (id: string): Promise<BloodPressureDto> => {
        try {
            const bloodPressure = await BloodPressureModel.findByPk(id);
            return await BloodPressureMapper.toDto(bloodPressure);
        } catch (error) {
            Logger.instance().log(error.message);
            throw new ApiError(500, error.message);
        }
    };

    search = async (filters: BloodPressureSearchFilters): Promise<BloodPressureSearchResults> => {
        try {

            const search = { where: {} };

            if (filters.PatientUserId != null) {
                search.where['PatientUserId'] = filters.PatientUserId;
            }
            if (filters.MinSystolicValue != null && filters.MaxSystolicValue != null) {
                search.where['Systolic'] = {
                    [Op.gte] : filters.MinSystolicValue,
                    [Op.lte] : filters.MaxSystolicValue,
                };
            } else if (filters.MinSystolicValue === null && filters.MaxSystolicValue !== null) {
                search.where['Systolic'] = {
                    [Op.lte] : filters.MaxSystolicValue,
                };
            } else if (filters.MinSystolicValue !== null && filters.MaxSystolicValue === null) {
                search.where['Systolic'] = {
                    [Op.gte] : filters.MinSystolicValue,
                };
            }
            if (filters.MinDiastolicValue != null && filters.MaxDiastolicValue != null) {
                search.where['Diastolic'] = {
                    [Op.gte] : filters.MinDiastolicValue,
                    [Op.lte] : filters.MaxDiastolicValue,
                };
            } else if (filters.MinDiastolicValue === null && filters.MaxDiastolicValue !== null) {
                search.where['Diastolic'] = {
                    [Op.lte] : filters.MaxDiastolicValue,
                };
            } else if (filters.MinDiastolicValue !== null && filters.MaxDiastolicValue === null) {
                search.where['Diastolic'] = {
                    [Op.gte] : filters.MinDiastolicValue,
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

            let orderByColum = 'CreatedAt';
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

            const foundResults = await BloodPressureModel.findAndCountAll(search);

            const dtos: BloodPressureDto[] = [];
            for (const bloodPressure of foundResults.rows) {
                const dto = await BloodPressureMapper.toDto(bloodPressure);
                dtos.push(dto);
            }

            const searchResults: BloodPressureSearchResults = {
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

    update = async (id: string, updateModel: BloodPressureDomainModel):
    Promise<BloodPressureDto> => {
        try {
            const bloodPressure = await BloodPressureModel.findByPk(id);

            if (updateModel.PatientUserId != null) {
                bloodPressure.PatientUserId = updateModel.PatientUserId;
            }
            if (updateModel.Systolic != null) {
                bloodPressure.Systolic = updateModel.Systolic;
            }
            if (updateModel.Diastolic != null) {
                bloodPressure.Diastolic = updateModel.Diastolic;
            }
            if (updateModel.Unit != null) {
                bloodPressure.Unit = updateModel.Unit;
            }
            if (updateModel.RecordDate != null) {
                bloodPressure.RecordDate = updateModel.RecordDate;
            }
            if (updateModel.RecordedByUserId != null) {
                bloodPressure.RecordedByUserId = updateModel.RecordedByUserId;
            }
    
            await bloodPressure.save();

            return await BloodPressureMapper.toDto(bloodPressure);

        } catch (error) {
            Logger.instance().log(error.message);
            throw new ApiError(500, error.message);
        }
    };

    delete = async (id: string): Promise<boolean> => {
        try {

            const result = await BloodPressureModel.destroy({ where: { id: id } });
            return result === 1;
        } catch (error) {
            Logger.instance().log(error.message);
            throw new ApiError(500, error.message);
        }
    };

}
