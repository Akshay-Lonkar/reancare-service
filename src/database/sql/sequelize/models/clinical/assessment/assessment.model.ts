import {
    BelongsTo,
    Column,
    CreatedAt,
    DataType,
    DeletedAt,
    ForeignKey,
    IsDate,
    IsUUID,
    Length,
    Model,
    PrimaryKey,
    Table,
    UpdatedAt,
} from 'sequelize-typescript';
import { v4 } from 'uuid';
import {
    AssessmentType,
    AssessmentTypeList,
} from '../../../../../../domain.types/clinical/assessment/assessment.types';
import {
    ProgressStatus, ProgressStatusList
} from '../../../../../../domain.types/miscellaneous/system.types';
import User from '../../user/user.model';
import UserTask from '../../user/user.task.model';
import AssessmentNode from './assessment.node.model';
import AssessmentTemplate from './assessment.template.model';

///////////////////////////////////////////////////////////////////////

@Table({
    timestamps      : true,
    modelName       : 'Assessment',
    tableName       : 'assessments',
    paranoid        : true,
    freezeTableName : true,
})
export default class Assessment extends Model {

    @IsUUID(4)
    @PrimaryKey
    @Column({
        type         : DataType.UUID,
        defaultValue : () => {
            return v4();
        },
        allowNull : false,
    })
    id: string;

    @Length({ max: 128 })
    @Column({
        type      : DataType.STRING(128),
        allowNull : false,
    })
    DisplayCode: string;

    @Column({
        type      : DataType.TEXT,
        allowNull : false,
    })
    Title: string;

    @Column({
        type      : DataType.TEXT,
        allowNull : true,
    })
    Description: string;

    @IsUUID(4)
    @ForeignKey(() => AssessmentTemplate)
    @Column({
        type      : DataType.UUID,
        allowNull : false,
    })
    AssessmentTemplateId: string;

    @BelongsTo(() => AssessmentTemplate)
    AssessmentTemplate: AssessmentTemplate;

    @Column({
        type         : DataType.ENUM,
        values       : AssessmentTypeList,
        defaultValue : AssessmentType.Careplan,
        allowNull    : false,
    })
    Type: string;

    @IsUUID(4)
    @ForeignKey(() => User)
    @Column({
        type      : DataType.UUID,
        allowNull : false,
    })
    PatientUserId: string;

    @BelongsTo(() => User)
    User: User;

    @Length({ max: 128 })
    @Column({
        type      : DataType.STRING(128),
        allowNull : true,
    })
    Provider: string;

    @Column({
        type      : DataType.TEXT,
        allowNull : true,
    })
    ProviderAssessmentCode: string;
    
    @Length({ max: 128 })
    @Column({
        type      : DataType.STRING(128),
        allowNull : true,
    })
    ProviderEnrollmentId: string;

    @Length({ max: 32 })
    @Column({
        type         : DataType.STRING(32),
        allowNull    : false,
        values       : ProgressStatusList,
        defaultValue : ProgressStatus.Pending
    })
    Status: string;

    @IsDate
    @Column({
        type      : DataType.DATE,
        allowNull : true,
    })
    StartedAt: Date;
 
    @IsDate
    @Column({
        type      : DataType.DATE,
        allowNull : true,
    })
    FinishedAt: Date;
 
    @Column({
        type      : DataType.STRING(16),
        allowNull : true,
    })
    ScheduledDateString: string;

    @IsUUID(4)
    @ForeignKey(() => AssessmentNode)
    @Column({
        type      : DataType.UUID,
        allowNull : true,
    })
    CurrentNodeId: string;

    @BelongsTo(() => AssessmentNode)
    CurrentNode: AssessmentNode;

    @IsUUID(4)
    @Column({
        type      : DataType.UUID,
        allowNull : true,
    })
    ParentActivityId: string;

    @IsUUID(4)
    @ForeignKey(() => UserTask)
    @Column({
        type      : DataType.UUID,
        allowNull : true,
    })
    UserTaskId: string;

    @BelongsTo(() => UserTask)
    UserTask: UserTask;

    @Column
    @CreatedAt
    CreatedAt: Date;

    @UpdatedAt
    UpdatedAt: Date;

    @DeletedAt
    DeletedAt: Date;

}
