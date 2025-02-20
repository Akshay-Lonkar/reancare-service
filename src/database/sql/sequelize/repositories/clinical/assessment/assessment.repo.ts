import { Op } from 'sequelize';
import { ApiError } from '../../../../../../common/api.error';
import { Logger } from '../../../../../../common/logger';
import { AssessmentDomainModel } from '../../../../../../domain.types/clinical/assessment/assessment.domain.model';
import { AssessmentDto } from '../../../../../../domain.types/clinical/assessment/assessment.dto';
import { AssessmentSearchFilters, AssessmentSearchResults } from '../../../../../../domain.types/clinical/assessment/assessment.search.types';
import { AssessmentType } from '../../../../../../domain.types/clinical/assessment/assessment.types';
import { ProgressStatus, uuid } from '../../../../../../domain.types/miscellaneous/system.types';
import { IAssessmentRepo } from '../../../../../repository.interfaces/clinical/assessment/assessment.repo.interface';
import { AssessmentMapper } from '../../../mappers/clinical/assessment/assessment.mapper';
import Assessment from '../../../models/clinical/assessment/assessment.model';

///////////////////////////////////////////////////////////////////////

export class AssessmentRepo implements IAssessmentRepo {

    //#region Publics

    public create = async (model: AssessmentDomainModel): Promise<AssessmentDto> => {
        try {
            const entity = {
                DisplayCode            : model.DisplayCode,
                Title                  : model.Title,
                Description            : model.Description,
                Type                   : model.Type ?? AssessmentType.Custom,
                PatientUserId          : model.PatientUserId ?? null,
                AssessmentTemplateId   : model.AssessmentTemplateId ?? null,
                Provider               : model.Provider ?? null,
                ProviderAssessmentCode : model.ProviderAssessmentCode ?? null,
                ProviderEnrollmentId   : model.ProviderEnrollmentId ?? null,
                Status                 : model.Status ?? ProgressStatus.Pending,
                ParentActivityId       : model.ParentActivityId ?? null,
                UserTaskId             : model.UserTaskId,
                ScheduledDateString    : model.ScheduledDateString ?? null,
                CurrentNodeId          : model.CurrentNodeId,
            };
            const assessment = await Assessment.create(entity);
            return AssessmentMapper.toDto(assessment);

        } catch (error) {
            Logger.instance().log(error.message);
            throw new ApiError(500, error.message);
        }
    };

    public getById = async (id: uuid): Promise<AssessmentDto> => {
        try {
            const assessment = await Assessment.findByPk(id);
            return AssessmentMapper.toDto(assessment);
            
        } catch (error) {
            Logger.instance().log(error.message);
            throw new ApiError(500, error.message);
        }
    };

    public getForPatient = async (patientUserId: uuid): Promise<AssessmentDto[]> => {
        try {
            const search = { where: {} };
            search.where['PatientUserId'] = { [Op.eq]: patientUserId };
            const foundResults = await Assessment.findAll(search);
            const dtos: AssessmentDto[] = [];
            for (const assessment of foundResults) {
                const dto = AssessmentMapper.toDto(assessment);
                dtos.push(dto);
            }
            return dtos;
        } catch (error) {
            Logger.instance().log(error.message);
            throw new ApiError(500, error.message);
        }
    };

    public update = async (id: uuid, updateModel: AssessmentDomainModel): Promise<AssessmentDto> => {
        try {
            const assessment = await Assessment.findByPk(id);

            if (updateModel.PatientUserId != null) {
                assessment.PatientUserId = updateModel.PatientUserId;
            }
            if (updateModel.AssessmentTemplateId != null) {
                assessment.AssessmentTemplateId = updateModel.AssessmentTemplateId;
            }
            if (updateModel.Status != null) {
                assessment.Status = updateModel.Status as ProgressStatus;
            }
            if (updateModel.StartedAt != null) {
                assessment.StartedAt = updateModel.StartedAt;
            }
            if (updateModel.FinishedAt != null) {
                assessment.FinishedAt = updateModel.FinishedAt;
            }

            await assessment.save();

            return AssessmentMapper.toDto(assessment);
            
        } catch (error) {
            Logger.instance().log(error.message);
            throw new ApiError(500, error.message);
        }
    };
    
    public search = async (filters: AssessmentSearchFilters): Promise<AssessmentSearchResults> => {

        try {
            const search = { where: {} };

            if (filters.PatientUserId != null) {
                search.where['PatientUserId'] = filters.PatientUserId;
            }
            if (filters.Title != null) {
                search.where['Title'] = { [Op.like]: '%' + filters.Title + '%' };
            }
            if (filters.Type != null) {
                search.where['Type'] = { [Op.like]: '%' + filters.Type + '%' };
            }
            if (filters.AssessmentTemplateId != null) {
                search.where['AssessmentTemplateId'] = { [Op.like]: '%' + filters.AssessmentTemplateId + '%' };
            }
            
            let orderByColum = 'Title';
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

            const foundResults = await Assessment.findAndCountAll(search);

            const dtos: AssessmentDto[] = [];
            for (const doctorNote of foundResults.rows) {
                const dto = AssessmentMapper.toDto(doctorNote);
                dtos.push(dto);
            }

            const searchResults: AssessmentSearchResults = {
                TotalCount     : foundResults.count,
                RetrievedCount : dtos.length,
                PageIndex      : pageIndex,
                ItemsPerPage   : limit,
                Order          : order === 'DESC' ? 'descending' : 'ascending',
                OrderedBy      : orderByColum,
                Items          : dtos
            };
            return searchResults;
            
        } catch (error) {
            Logger.instance().log(error.message);
            throw new ApiError(500, error.message);
        }
    };

    public delete = async (id: uuid): Promise<boolean> => {
        try {
            await Assessment.destroy({ where: { id: id } });
            return true;
        } catch (error) {
            Logger.instance().log(error.message);
            throw new ApiError(500, error.message);
        }
    };

    public getByTemplateAndSchedule = async (
        templateId: string, sequence: number, scheduledDate: string): Promise<AssessmentDto> => {
        try {
            const assessment = await Assessment.findOne({
                where : {
                    TemplateId          : templateId,
                    Sequence            : sequence,
                    ScheduledDateString : scheduledDate
                },
            });
            return AssessmentMapper.toDto(assessment);
        } catch (error) {
            Logger.instance().log(error.message);
            throw new ApiError(500, error.message);
        }
    };

    public getByActivityId = async (activityId: uuid): Promise<AssessmentDto> => {
        try {
            const assessment = await Assessment.findOne({
                where : {
                    ParentActivityId : activityId,
                },
            });
            return AssessmentMapper.toDto(assessment);
        } catch (error) {
            Logger.instance().log(error.message);
            throw new ApiError(500, error.message);
        }
    };

    public getByUserTaskId = async (taskId: uuid): Promise<AssessmentDto> => {
        try {
            const assessment = await Assessment.findOne({
                where : {
                    UserTaskId : taskId,
                },
            });
            return AssessmentMapper.toDto(assessment);
        } catch (error) {
            Logger.instance().log(error.message);
            throw new ApiError(500, error.message);
        }
    };

    public startAssessment = async (id: uuid): Promise<AssessmentDto> => {
        try {
            var assessment = await Assessment.findByPk(id);
            assessment.StartedAt = new Date();
            assessment.Status = ProgressStatus.InProgress;
            await assessment.save();
            return AssessmentMapper.toDto(assessment);
        } catch (error) {
            Logger.instance().log(error.message);
            throw new ApiError(500, error.message);
        }
    };

    public setCurrentNode = async (assessmentId: uuid, nodeId: uuid): Promise<AssessmentDto> => {
        try {
            var assessment = await Assessment.findByPk(assessmentId);
            assessment.CurrentNodeId = nodeId;
            await assessment.save();
            return AssessmentMapper.toDto(assessment);
        } catch (error) {
            Logger.instance().log(error.message);
            throw new ApiError(500, error.message);
        }
    };

    public completeAssessment = async (assessmentId: string): Promise<AssessmentDto> => {
        try {
            var assessment = await Assessment.findByPk(assessmentId);
            assessment.FinishedAt = new Date();
            assessment.Status = ProgressStatus.Completed;
            await assessment.save();
            return AssessmentMapper.toDto(assessment);
        } catch (error) {
            Logger.instance().log(error.message);
            throw new ApiError(500, error.message);
        }
    };

    //#endregion

}
