import { PatientDomainModel } from "../../../../domain.types/patient/patient/patient.domain.model";
import { ICarePlanService } from "../../interfaces/careplan.service.interface";
import needle = require('needle');
import { Logger } from '../../../../common/logger';
import { AhaCache } from './aha.cache';
import Participant from "../../../../database/sql/sequelize/models/careplan/participant.model";
import { ParticipantMapper } from "../../../../database/sql/sequelize/mappers/participant.mapper";
import { ApiError } from "../../../../common/api.error";
import { IPersonRepo } from "../../../../database/repository.interfaces/person.repo.interface";
import { IUserTaskRepo } from "../../../../database/repository.interfaces/user/user.task.repo.interface";
import { inject } from "tsyringe";
import { EnrollmentDomainModel } from "../../domain.types/enrollment/enrollment.domain.model";
import { Helper } from "../../../../common/helper";
import { EnrollmentDto } from "../../domain.types/enrollment/enrollment.dto";
import CareplanArtifact from "../../../../database/sql/sequelize/models/careplan/careplan.artifact.model";
import { CareplanArtifactMapper } from "../../../../database/sql/sequelize/mappers/careplan/artifact.mapper";
import { UserActionType, UserTaskCategory } from "../../../../domain.types/user/user.task/user.task.types";
import { TimeHelper } from "../../../../common/time.helper";
import { DateStringFormat, DurationType } from "../../../../domain.types/miscellaneous/time.types";

//////////////////////////////////////////////////////////////////////////////////////////////////

export class AhaCarePlanService implements ICarePlanService {

    constructor(
        @inject('IPersonRepo') private _personRepo: IPersonRepo,
        @inject('IUserTaskRepo') private _userTaskRepo: IUserTaskRepo,
    ) {}

    public init = async (): Promise<boolean> => {
        var headers = {
            "Content-Type"    : "application/x-www-form-urlencoded",
            Accept            : "*/*",
            "Cache-Control"   : "no-cache",
            "Accept-Encoding" : "gzip, deflate, br",
            Connection        : "keep-alive"
        };

        var options = {
            headers    : headers,
            compressed : true,
            json       : false
        };

        var url = process.env.AHA_API_BASE_URL + "/token";

        var body = {
            client_id     : process.env.AHA_CONTINUITY_CLIENT_ID,
            client_secret : process.env.AHA_CONTINUITY_CLIENT_SECRET,
            grant_type    : 'client_credentials'
        };
        
        var response = await needle("post", url, body, options);
        if (response.statusCode === 200) {
            AhaCache.SetWebToken(response.body.access_token, response.body.expires_in);
            Logger.instance().log('Successfully connected to AHA API service!' + AhaCache.GetWebToken() + " Expires On: " + AhaCache.GetTokenExpirationTime());
            return true;
        }
        else {
            Logger.instance().error('Unable to connect AHA API service!', response.statusCode, null);
            return false;
        }
    
    }

    public registerPatient = async (patientDomainModel: PatientDomainModel): Promise<any> => {

        try {

            var existingParticipant = await Participant.findOne({ where: { UserId: patientDomainModel.UserId } });

            if (existingParticipant) {
                const dto = await ParticipantMapper.toDto(existingParticipant);
                return dto;
            }

            Logger.instance().log(`Person id: ${JSON.stringify(patientDomainModel)}`);

            if (!patientDomainModel.User.Person) {
                throw new ApiError(500, "Unable to register participant as Person not found!");
            }

            var personDetails = await this._personRepo.getById(patientDomainModel.User.Person.id);

            Logger.instance().log(`Person Details: ${JSON.stringify(personDetails)}`);

            const entity = {
                UserId         : patientDomainModel.UserId,
                ParticipantId  : null,
                Name           : personDetails.FirstName,
                IsActive       : true,
                Gender         : personDetails.Gender,
                Age            : parseInt(personDetails.Age),
                DOB            : null,
                HeightInInches : null,
                WeightInLbs    : null,
                MaritalStatus  : null,
                ZipCode        : null,

            };

            var meta = {};

            if (entity.Age) {
                meta['age'] = entity.Age;
            }
            if (entity.DOB) {
                meta['dob'] = entity.DOB;
            }
            if (entity.Gender) {
                meta['gender'] = entity.Gender;
            }
            if (entity.HeightInInches) {
                meta['heightInInches'] = entity.HeightInInches;
            }
            if (entity.MaritalStatus) {
                meta['maritalStatus'] = entity.MaritalStatus;
            }
            if (entity.WeightInLbs) {
                meta['weightInLbs'] = entity.WeightInLbs;
            }
            if (entity.ZipCode) {
                meta['zipCode'] = entity.ZipCode;
            }

            var body = {
                "isActive" : 1,
                "meta"     : meta,
                "userId"   : entity.UserId
            };

            if (entity.Name) {
                body['name'] = entity.Name;
            }

            var url = process.env.AHA_API_BASE_URL + "/participants";

            Logger.instance().log(`body: ${JSON.stringify(body)}`);
        
            var response = await needle("post", url, body, this.getHeaderOptions());
            if (response.statusCode !== 200) {
                Logger.instance().log(`Body: ${JSON.stringify(response.body.error)}`);
                Logger.instance().error('Unable to register participant with AHA API service!', response.statusCode, null);
                return false;
            }

            Logger.instance().log(`response body: ${JSON.stringify( response.body)}`);
            entity.ParticipantId = response.body.data.participant.id;

            const participant = await Participant.create(entity);
            const dto = await ParticipantMapper.toDto(participant);
            return dto;
        } catch (error) {
            Logger.instance().log(error.message);
            throw new ApiError(500, error.message);
        }
        
    }

    public registerPatientToCarePlan =
    async (patientDomainModel: PatientDomainModel, enrollmentDomainModel: EnrollmentDomainModel): Promise<any> => {

        try {
            var participantDetails = await Participant.findOne({ where: { UserId: patientDomainModel.UserId } });

            Logger.instance().log(`Participant details1: ${JSON.stringify(participantDetails)}`);

            if (!participantDetails) {
                participantDetails = await this.registerPatient(patientDomainModel);
            }
            
            if (!participantDetails) {
                throw new ApiError(500, "Unable to register participant with careplan service");
            }
            Logger.instance().log(`Participant details2: ${JSON.stringify(participantDetails)}`);

            var enrollmentData = {
                userId       : participantDetails.UserId,
                careplanCode : enrollmentDomainModel.CareplanCode,
                startAt      : enrollmentDomainModel.StartDate,
                endAt        : enrollmentDomainModel.EndDate,
                meta         : {
                    gender : participantDetails.Gender
                },
            };

            Logger.instance().log(`Enrollment details: ${JSON.stringify(enrollmentData)}`);

            var url = process.env.AHA_API_BASE_URL + "/enrollments";
        
            var response = await needle("post", url, enrollmentData, this.getHeaderOptions());

            Logger.instance().log(`Enrollment response code: ${JSON.stringify(response.statusCode)}`);

            if (response.statusCode !== 200) {
                Logger.instance().log(`Body: ${JSON.stringify(response.body.error)}`);
                Logger.instance().error('Unable to enroll patient with AHA API service!', response.statusCode, null);
                throw new ApiError(500, "Careplan service error: " + response.body.error.message);
            }

            Logger.instance().log(`response body: ${JSON.stringify( response.body)}`);
            return response.body.data.enrollment;

        } catch (error) {
            Logger.instance().log(error.message);
            throw new ApiError(500, error.message);
        }
    }

    public fetchTasks =
    async(enrollmentDto:EnrollmentDto): Promise<any> => {

        try {
        
            var startDate = Helper.formatDate(enrollmentDto.StartAt);
            var endDate = Helper.formatDate(enrollmentDto.EndAt);

            Logger.instance().log(`Start Date: ${(startDate)}`);
            Logger.instance().log(`End Date: ${(endDate)}`);

            const AHA_API_BASE_URL = process.env.AHA_API_BASE_URL;
            var url = `${AHA_API_BASE_URL}/enrollments/${enrollmentDto.EnrollmentId}/activities?fromDate=${startDate}&toDate=${endDate}&pageSize=500`;
        
            var response = await needle("get", url, this.getHeaderOptions());

            if (response.statusCode !== 200) {
                Logger.instance().log(`Body: ${JSON.stringify(response.body.error)}`);
                Logger.instance().error('Unable to fetch tasks for given enrollment id!', response.statusCode, null);
                throw new ApiError(500, "Careplan service error: " + response.body.error.message);
            }

            // AHA response has incorrect spelling of activities: "activitites"
            Logger.instance().log(`response body for activities: ${JSON.stringify(response.body.data.activitites.length)}`);
            var activities = response.body.data.activitites;
            var activityEntities = [];

            activities.forEach(activity => {
                var entity = {
                    CareplanProvider : enrollmentDto.CareplanProvider,
                    CareplanName     : enrollmentDto.CareplanName,
                    UserId           : enrollmentDto.UserId,
                    EnrollmentId     : enrollmentDto.EnrollmentId,
                    Type             : activity.type,
                    ProviderActionId : activity.code,
                    Title            : activity.title,
                    ScheduledAt      : activity.scheduledAt,
                    Sequence         : activity.sequence,
                    Frequency        : activity.frequency,
                    Status           : activity.status
                };

                activityEntities.push(entity);
            });
            
            const tasks = await CareplanArtifact.bulkCreate(activityEntities);

            var taskDtos = [];
            var tasksGroupedByDate = {};
            for (const task of tasks) {
                var dto = await CareplanArtifactMapper.toDto(task);

                taskDtos.push(dto);
                var scheduledDate = TimeHelper.timestamp(dto.ScheduledAt);
                if (!tasksGroupedByDate[scheduledDate]) {
                    tasksGroupedByDate[scheduledDate] = [];
                }

                tasksGroupedByDate[scheduledDate].push(dto);
            }

            Logger.instance().log(`calling task creation logic`);
            await this.createScheduledUserTasks(tasksGroupedByDate);

            Logger.instance().log(`Imported all AHA tasks for enrollment id: ${enrollmentDto.EnrollmentId}`);

            return taskDtos;

        } catch (error) {
            Logger.instance().log(error.message);
            throw new ApiError(500, error.message);
        }
    }

    public fetchTasksDetails = async (id: string): Promise<any> => {
        Logger.instance().log(`Fetching task details for action id: ${id}`);

        const careplanArtifact = await CareplanArtifact.findOne({ where: { id: id } });

        const AHA_API_BASE_URL = process.env.AHA_API_BASE_URL;

        var scheduledDate = TimeHelper.getDateString(careplanArtifact.ScheduledAt, DateStringFormat.YYYY_MM_DD);
        var queryParam = `scheduledAt=${scheduledDate}&sequence=${careplanArtifact.Sequence}`;

        var url = `${AHA_API_BASE_URL}/enrollments/${careplanArtifact.EnrollmentId}/activities/${careplanArtifact.ProviderActionId}?${queryParam}`;
    
        Logger.instance().log(`URL: ${JSON.stringify(url)}`);

        var response = await needle("get", url, this.getHeaderOptions());

        if (response.statusCode !== 200) {
            Logger.instance().log(`Body: ${JSON.stringify(response.body.error)}`);
            Logger.instance().error('Unable to fetch details for given artifact id!', response.statusCode, null);

            // throw new ApiError(500, "Careplan service error: " + response.body.error.message);
            return {};
        }

        Logger.instance().log(`response body for activity details: ${JSON.stringify(response.body.data.activity)}`);

        var activityDetails = response.body.data.activity;
        var actionDto = {
            Type        : activityDetails.type ?? "",
            Name        : activityDetails.name ?? "",
            Text        : activityDetails.text ?? "",
            Description : activityDetails.description ?? "",
            URL         : activityDetails.url ?? "",
            Category    : activityDetails.category ?? [],
            Items       : activityDetails.items ?? [],

        };

        return actionDto;
    }

    delete(id: string): Promise<any> {
        throw new Error("Method not implemented.");
    }

    getHeaderOptions() {

        var headers = {
            "Content-Type"  : "application/json",
            "accept"        : "application/json",
            "Authorization" : "Bearer " + AhaCache.GetWebToken()
        };

        var options = {
            headers : headers
        };

        return options;
    }

    async createScheduledUserTasks(tasksGroupedByDate) {
        // creare user.tasks based on activities
        for (const scheduledDate in tasksGroupedByDate) {
            var tasks = tasksGroupedByDate[scheduledDate];

            Logger.instance().log(`Creating user tasks for: ${scheduledDate}, total tasks: ${tasks.length}`);

            tasks.sort((a, b) => {
                return a.Sequence - b.Sequence;
            });

            tasks.forEach( async (taskDto) => {
                var dayStart = TimeHelper.addDuration(taskDto.ScheduledAt, 7, DurationType.Hour);       // Start at 7:00 AM
                var scheduleDelay = (taskDto.Sequence - 1) * 1;
                var startTime = TimeHelper.addDuration(dayStart, scheduleDelay, DurationType.Second);   // Scheduled at every 1 sec
                var endTime = TimeHelper.addDuration(taskDto.ScheduledAt, 23, DurationType.Hour);       // End at 11:00 PM

                var userTaskModel = {
                    UserId             : taskDto.UserId,
                    DisplayId          : taskDto.CareplanName + '-' + taskDto.ProviderActionId,
                    Task               : taskDto.Title,
                    Category           : UserTaskCategory[taskDto.Type] ?? UserTaskCategory.Custom,
                    Description        : null,
                    ActionType         : UserActionType.Careplan,
                    ActionId           : taskDto.id,
                    ScheduledStartTime : startTime,
                    ScheduledEndTime   : endTime
                };
        
                var userTaskDto = await this._userTaskRepo.create(userTaskModel);
                Logger.instance().log(`New user task created for AHA careplan with id: ${userTaskDto.id}`);
            });
        }
    }

}
