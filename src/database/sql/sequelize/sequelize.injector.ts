import 'reflect-metadata';
import { DependencyContainer } from 'tsyringe';
import { DatabaseConnector_Sequelize } from './database.connector.sequelize';
import { AddressRepo } from './repositories/address.repo';
import { ApiClientRepo } from './repositories/api.client.repo';
import { AllergyRepo } from './repositories/clinical/allergy.repo';
import { BloodGlucoseRepo } from './repositories/clinical/biometrics/blood.glucose.repo';
import { BloodOxygenSaturationRepo } from './repositories/clinical/biometrics/blood.oxygen.saturation.repo';
import { BloodPressureRepo } from './repositories/clinical/biometrics/blood.pressure.repo';
import { BodyHeightRepo } from './repositories/clinical/biometrics/body.height.repo';
import { BodyTemperatureRepo } from './repositories/clinical/biometrics/body.temperature.repo';
import { BodyWeightRepo } from './repositories/clinical/biometrics/body.weight.repo';
import { PulseRepo } from './repositories/clinical/biometrics/pulse.repo';
import { ComplaintRepo } from './repositories/clinical/complaint.repo';
import { DailyAssessmentRepo } from './repositories/clinical/daily.assessment/daily.assessment.repo';
import { DiagnosisRepo } from './repositories/clinical/diagnosis.repo';
import { DoctorNoteRepo } from './repositories/clinical/doctor.note.repo';
import { EmergencyEventRepo } from './repositories/clinical/emergency.event.repo';
import { MedicalConditionRepo } from './repositories/clinical/medical.condition.repo';
import { DrugRepo } from './repositories/clinical/medication/drug.repo';
import { MedicationConsumptionRepo } from './repositories/clinical/medication/medication.consumption.repo';
import { MedicationRepo } from './repositories/clinical/medication/medication.repo';
import { MedicationStockImageRepo } from './repositories/clinical/medication/medication.stock.image.repo';
import { OrderRepo } from './repositories/clinical/order.repo';
import { HowDoYouFeelRepo } from './repositories/clinical/symptom/how.do.you.feel.repo';
import { SymptomAssessmentRepo } from './repositories/clinical/symptom/symptom.assessment.repo';
import { SymptomAssessmentTemplateRepo } from './repositories/clinical/symptom/symptom.assessment.template.repo';
import { SymptomRepo } from './repositories/clinical/symptom/symptom.repo';
import { SymptomTypeRepo } from './repositories/clinical/symptom/symptom.type.repo';
import { DoctorRepo } from './repositories/doctor.repo';
import { KnowledgeNuggetRepo } from './repositories/educational/knowledge.nugget.repo';
import { FileResourceRepo } from './repositories/file.resource.repo';
import { InternalTestUserRepo } from './repositories/internal.test.user.repo';
import { OrganizationRepo } from './repositories/organization.repo';
import { OtpRepo } from './repositories/otp.repo';
import { DocumentRepo } from './repositories/patient/document.repo';
import { EmergencyContactRepo } from './repositories/patient/emergency.contact.repo';
import { GoalRepo } from './repositories/patient/goal.repo';
import { HealthProfileRepo } from './repositories/patient/health.profile.repo';
import { PatientRepo } from './repositories/patient/patient.repo';
import { PersonRepo } from './repositories/person.repo';
import { PersonRoleRepo } from './repositories/person.role.repo';
import { RolePrivilegeRepo } from './repositories/role.privilege.repo';
import { RoleRepo } from './repositories/role.repo';
import { UserDeviceDetailsRepo } from './repositories/user/user.device.details.repo';
import { UserRepo } from './repositories/user/user.repo';
import { UserTaskRepo } from './repositories/user/user.task.repo';
import { CalorieBalanceRepo } from './repositories/wellness/daily.records/calorie.balance.repo';
import { HeartPointsRepo } from './repositories/wellness/daily.records/heart.points.repo';
import { MoveMinutesRepo } from './repositories/wellness/daily.records/move.minutes.repo';
import { SleepRepo } from './repositories/wellness/daily.records/sleep.repo';
import { StepCountRepo } from './repositories/wellness/daily.records/step.count.repo';
import { MeditationRepo } from './repositories/wellness/exercise/meditation.repo';
import { PhysicalActivityRepo } from './repositories/wellness/exercise/physical.activity.repo';
import { FoodConsumptionRepo } from './repositories/wellness/nutrition/food.consumption.repo';
import { WaterConsumptionRepo } from './repositories/wellness/nutrition/water.consumption.repo';
import { CareplanRepo } from './repositories/clinical/careplan/careplan.repo';
import { AssessmentRepo } from './repositories/clinical/assessment/assessment.repo';
import { AssessmentTemplateRepo } from './repositories/clinical/assessment/assessment.template.repo';
import { AssessmentHelperRepo } from './repositories/clinical/assessment/assessment.helper.repo';
import { HealthPriorityRepo } from './repositories/health.priority/health.priority.repo';
import { ActionPlanRepo } from './repositories/goal.action.plan/goal.action.plan.repo';

////////////////////////////////////////////////////////////////////////////////

export class SequelizeInjector {
    
    static registerInjections(container: DependencyContainer) {
        
        container.register('IDatabaseConnector', DatabaseConnector_Sequelize);

        container.register('IPersonRepo', PersonRepo);
        container.register('IUserRepo', UserRepo);
        container.register('IPersonRoleRepo', PersonRoleRepo);
        container.register('IRoleRepo', RoleRepo);
        container.register('IOtpRepo', OtpRepo);
        container.register('IApiClientRepo', ApiClientRepo);
        container.register('IPatientRepo', PatientRepo);
        container.register('IAddressRepo', AddressRepo);
        container.register('IRolePrivilegeRepo', RolePrivilegeRepo);
        container.register('IOrganizationRepo', OrganizationRepo);
        container.register('IDoctorRepo', DoctorRepo);
        container.register('IBloodPressureRepo', BloodPressureRepo);
        container.register('IBodyWeightRepo', BodyWeightRepo);
        container.register('IBodyHeightRepo', BodyHeightRepo);
        container.register('IPatientHealthProfileRepo', HealthProfileRepo);
        container.register('IBloodOxygenSaturationRepo', BloodOxygenSaturationRepo);
        container.register('IHealthProfileRepo', HealthProfileRepo);
        container.register('IInternalTestUserRepo', InternalTestUserRepo);
        container.register('IStepCountRepo', StepCountRepo);
        container.register('IPulseRepo', PulseRepo);
        container.register('IBodyTemperatureRepo', BodyTemperatureRepo);
        container.register('IMedicationStockImageRepo', MedicationStockImageRepo);
        container.register('IFoodConsumptionRepo', FoodConsumptionRepo);
        container.register('IMoveMinutesRepo', MoveMinutesRepo);
        container.register('ICalorieBalanceRepo', CalorieBalanceRepo);
        container.register('IHeartPointsRepo', HeartPointsRepo);
        container.register('IComplaintRepo', ComplaintRepo);
        container.register('IAllergyRepo', AllergyRepo);
        container.register('IDoctorNoteRepo', DoctorNoteRepo);
        container.register('IPhysicalActivityRepo', PhysicalActivityRepo);
        container.register('IKnowledgeNuggetRepo', KnowledgeNuggetRepo);
        container.register('IOrderRepo', OrderRepo);
        container.register('IWaterConsumptionRepo', WaterConsumptionRepo);
        container.register('IEmergencyContactRepo', EmergencyContactRepo);
        container.register('ISleepRepo', SleepRepo);
        container.register('IEmergencyEventRepo', EmergencyEventRepo);
        container.register('IMeditationRepo', MeditationRepo);
        container.register('IDocumentRepo', DocumentRepo);
        container.register('ISymptomTypeRepo', SymptomTypeRepo);
        container.register('ISymptomRepo', SymptomRepo);
        container.register('ISymptomAssessmentRepo', SymptomAssessmentRepo);
        container.register('ISymptomAssessmentTemplateRepo', SymptomAssessmentTemplateRepo);
        container.register('IFileResourceRepo', FileResourceRepo);
        container.register('IBloodGlucoseRepo', BloodGlucoseRepo);
        container.register('IDiagnosisRepo', DiagnosisRepo);
        container.register('IHowDoYouFeelRepo', HowDoYouFeelRepo);
        container.register('IDrugRepo', DrugRepo);
        container.register('IUserDeviceDetailsRepo', UserDeviceDetailsRepo);
        container.register('IGoalRepo', GoalRepo);
        container.register('IMedicationRepo', MedicationRepo);
        container.register('IMedicationConsumptionRepo', MedicationConsumptionRepo);
        container.register('IUserTaskRepo', UserTaskRepo);
        container.register('IMedicalConditionRepo', MedicalConditionRepo);
        container.register('IDailyAssessmentRepo', DailyAssessmentRepo);
        container.register('ICareplanRepo', CareplanRepo);
        container.register('IAssessmentRepo', AssessmentRepo);
        container.register('IAssessmentTemplateRepo', AssessmentTemplateRepo);
        container.register('IAssessmentHelperRepo', AssessmentHelperRepo);
        container.register('IHealthPriorityRepo', HealthPriorityRepo);
        container.register('IActionPlanRepo', ActionPlanRepo);
        
    }

}
