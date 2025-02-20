import { UserTaskCategory } from "../../../../../../domain.types/user/user.task/user.task.types";
import { CareplanActivityDto } from "../../../../../../domain.types/clinical/careplan/activity/careplan.activity.dto";
import CareplanActivity from "../../../models/clinical/careplan/careplan.activity.model";

///////////////////////////////////////////////////////////////////////////////////

export class CareplanActivityMapper {

    static toDto = (activity: CareplanActivity): CareplanActivityDto => {

        if (activity == null){
            return null;
        }

        const dto: CareplanActivityDto = {
            id               : activity.id,
            UserTaskId       : activity.UserTaskId,
            PatientUserId    : activity.PatientUserId,
            EnrollmentId     : activity.EnrollmentId,
            Provider         : activity.Provider,
            PlanName         : activity.PlanName,
            PlanCode         : activity.PlanCode,
            Type             : activity.Type,
            Category         : activity.Category as UserTaskCategory,
            ProviderActionId : activity.ProviderActionId,
            Title            : activity.Title,
            Description      : activity.Description,
            Url              : activity.Url,
            ScheduledAt      : activity.ScheduledAt,
            StartedAt        : activity.StartedAt,
            CompletedAt      : activity.CompletedAt,
            Comments         : activity.Comments,
            Sequence         : activity.Sequence,
            Frequency        : activity.Frequency,
            Status           : activity.Status,
            RawContent       : activity.RawContent,
        };
        return dto;
    };

}
