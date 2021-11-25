import { Op } from 'sequelize';
import { ComplaintSearchResults, ComplaintSearchFilters } from '../../../../../domain.types/clinical/complaint/complaint.search.types';
import { ApiError } from '../../../../../common/api.error';
import { Logger } from '../../../../../common/logger';
import { ComplaintDomainModel } from '../../../../../domain.types/clinical/complaint/complaint.domain.model';
import { ComplaintDto } from '../../../../../domain.types/clinical/complaint/complaint.dto';
import { IComplaintRepo } from '../../../../repository.interfaces/clinical/complaint.repo.interface';
import { ComplaintMapper } from '../../mappers/clinical/complaint.mapper';
import Complaint from '../../models/clinical/complaint.model';

///////////////////////////////////////////////////////////////////////

export class ComplaintRepo implements IComplaintRepo {

    create = async (createModel: ComplaintDomainModel): Promise<ComplaintDto> => {
        try {
            const entity = {
                PatientUserId             : createModel.PatientUserId ?? null,
                MedicalPractitionerUserId : createModel.MedicalPractitionerUserId ?? null,
                VisitId                   : createModel.VisitId ?? null,
                Complaint                 : createModel.Complaint ?? null,
                Severity                  : createModel.Severity,
                RecordDate                : createModel.RecordDate ?? null
            };
            const complaint = await Complaint.create(entity);
            return await ComplaintMapper.toDto(complaint);

        } catch (error) {
            Logger.instance().log(error.message);
            throw new ApiError(500, error.message);
        }
    };

    getById = async (id: string): Promise<ComplaintDto> => {
        try {
            const complaint = await Complaint.findByPk(id);
            return await ComplaintMapper.toDto(complaint);

        } catch (error) {
            Logger.instance().log(error.message);
            throw new ApiError(500, error.message);
        }
    };

    search = async (filters: ComplaintSearchFilters): Promise<ComplaintSearchResults> => {
        try {
            
            const search = { where: {} };

            if (filters.PatientUserId != null) {
                search.where['PatientUserId'] = filters.PatientUserId;
            }
            if (filters.MedicalPractitionerUserId != null) {
                search.where['MedicalPractitionerUserId'] = filters.MedicalPractitionerUserId;
            }
            if (filters.VisitId != null) {
                search.where['VisitId'] = filters.VisitId;
            }
            if (filters.Complaint != null) {
                search.where['Complaint'] = filters.Complaint;
            }
            if (filters.Severity != null) {
                search.where['Severity'] = filters.Severity;
            }
            if (filters.DateFrom != null && filters.DateTo != null) {
                search.where['CreatedAt'] = {
                    [Op.gte] : filters.DateFrom,
                    [Op.lte] : filters.DateTo,
                };
            } else if (filters.DateFrom === null && filters.DateTo !== null) {
                search.where['CreatedAt'] = {
                    [Op.lte] : filters.DateTo,
                };
            } else if (filters.DateFrom !== null && filters.DateTo === null) {
                search.where['CreatedAt'] = {
                    [Op.gte] : filters.DateFrom,
                };
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

            const foundResults = await Complaint.findAndCountAll(search);

            const dtos: ComplaintDto[] = [];
            for (const complaint of foundResults.rows) {
                const dto = await ComplaintMapper.toDto(complaint);
                dtos.push(dto);
            }

            const searchResults: ComplaintSearchResults = {
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

    update = async (id: string, complaintDomainModel: ComplaintDomainModel): Promise<ComplaintDto> => {
        try {
            const complaint = await Complaint.findByPk(id);

            if (complaintDomainModel.PatientUserId != null) {
                complaint.PatientUserId = complaintDomainModel.PatientUserId;
            }
            if (complaintDomainModel.MedicalPractitionerUserId != null) {
                complaint.MedicalPractitionerUserId = complaintDomainModel.MedicalPractitionerUserId;
            }
            if (complaintDomainModel.VisitId != null) {
                complaint.VisitId = complaintDomainModel.VisitId;
            }
            if (complaintDomainModel.EhrId != null) {
                complaint.EhrId = complaintDomainModel.EhrId;
            }
            if (complaintDomainModel.Complaint != null) {
                complaint.Complaint = complaintDomainModel.Complaint;
            }
            if (complaintDomainModel.Severity != null) {
                complaint.Severity = complaintDomainModel.Severity;
            }
            if (complaintDomainModel.RecordDate != null) {
                complaint.RecordDate = complaintDomainModel.RecordDate;
            }
            await complaint.save();

            const dto = await ComplaintMapper.toDto(complaint);
            return dto;
        } catch (error) {
            Logger.instance().log(error.message);
            throw new ApiError(500, error.message);
        }
    };

    delete = async (id: string): Promise<boolean> => {
        try {
            const result = await Complaint.destroy({ where: { id: id } });
            return result === 1;
        } catch (error) {
            Logger.instance().log(error.message);
            throw new ApiError(500, error.message);
        }
    };

}
