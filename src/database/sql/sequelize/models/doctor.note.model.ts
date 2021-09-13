import {
    Table,
    Column,
    Model,
    DataType,
    CreatedAt,
    UpdatedAt,
    DeletedAt,
    IsUUID,
    PrimaryKey,
    Length,
    IsDate,
    ForeignKey,
} from 'sequelize-typescript';

import { v4 } from 'uuid';
import User from './user.model';
import { ValidationStatus, ValidationStatusList } from '../../../../domain.types/diagnosis/diagnosis.types';

///////////////////////////////////////////////////////////////////////

@Table({
    timestamps      : true,
    modelName       : 'DoctorNote',
    tableName       : 'doctor_notes',
    paranoid        : true,
    freezeTableName : true,
})
export default class DoctorNote extends Model {

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
        allowNull : true,
    })
    EhrId: string;

    @IsUUID(4)
    @ForeignKey(() => User)
    @Column({
        type      : DataType.UUID,
        allowNull : false,
    })
    PatientUserId: string;

    @IsUUID(4)
    @ForeignKey(() => User)
    @Column({
        type      : DataType.UUID,
        allowNull : true,
    })
    MedicalPractitionerUserId: string;

    @IsUUID(4)
    @ForeignKey(() => User)
    @Column({
        type      : DataType.UUID,
        allowNull : true,
    })
    VisitId: string;

    @Length({ max: 512 })
    @Column({
        type      : DataType.STRING(512),
        allowNull : false,
    })
    Notes: string;

    @Length({ max: 32 })
    @Column({
        type         : DataType.STRING(32),
        allowNull    : false,
        values       : ValidationStatusList,
        defaultValue : ValidationStatus.Preliminary
    })
    ValidationStatus: string;

    @IsDate
    @Column({
        type      : DataType.DATE,
        allowNull : true,
    })
    RecordDate: Date

    @Column
    @CreatedAt
    CreatedAt: Date;

    @UpdatedAt
    UpdatedAt: Date;

    @DeletedAt
    DeletedAt: Date;

}
