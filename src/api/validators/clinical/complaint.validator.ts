import express from 'express';
import { ComplaintSearchFilters } from '../../../domain.types/clinical/complaint/complaint.search.types';
import { ComplaintDomainModel } from '../../../domain.types/clinical/complaint/complaint.domain.model';
import { BaseValidator, Where } from '../base.validator';

///////////////////////////////////////////////////////////////////////////////////////

export class ComplaintValidator extends BaseValidator{

    getDomainModel = (request: express.Request): ComplaintDomainModel => {

        const complaintModel: ComplaintDomainModel = {
            PatientUserId             : request.body.PatientUserId ?? null,
            MedicalPractitionerUserId : request.body.MedicalPractitionerUserId ?? null,
            VisitId                   : request.body.VisitId ?? null,
            Complaint                 : request.body.Complaint ?? null,
            Severity                  : request.body.Severity,
            RecordDate                : request.body.RecordDate ?? new Date(),
        };

        return complaintModel;
    };

    create = async (request: express.Request): Promise<ComplaintDomainModel> => {
        await this.validateCreateBody(request);
        return this.getDomainModel(request);
    };

    search = async (request: express.Request): Promise<ComplaintSearchFilters> => {
        await this.validateUuid(request, 'patientUserId', Where.Query, false, false);
        await this.validateUuid(request, 'medicalPractitionerUserId', Where.Query, false, false);
        await this.validateUuid(request, 'visitId', Where.Query, false, false);
        await this.validateString(request, 'complaint', Where.Query, false, false);
        await this.validateString(request, 'severity', Where.Query, false, false);
        await this.validateDate(request, 'dateFrom', Where.Query, false, false);
        await this.validateDate(request, 'dateTo', Where.Query, false, false);

        await this.validateBaseSearchFilters(request);
        
        this.validateRequest(request);

        return this.getFilter(request);
    };

    update = async (request: express.Request): Promise<ComplaintDomainModel> => {

        await this.validateUpdateBody(request);
        const domainModel = this.getDomainModel(request);
        domainModel.id = await this.getParamUuid(request, 'id');
        return domainModel;
    };

    private  async validateCreateBody(request) {

        await this.validateUuid(request, 'PatientUserId', Where.Body, true, false);
        await this.validateUuid(request, 'MedicalPractitionerUserId', Where.Body, true, false);
        await this.validateUuid(request, 'VisitId', Where.Body, true, false);
        await this.validateString(request, 'Complaint', Where.Body, true, false);
        await this.validateString(request, 'Severity', Where.Body, false, false);
        await this.validateDate(request, 'RecordDate', Where.Body, false, true);

        this.validateRequest(request);
    }
    
    private  async validateUpdateBody(request) {

        await this.validateUuid(request, 'PatientUserId', Where.Body, false, false);
        await this.validateUuid(request, 'MedicalPractitionerUserId', Where.Body, false, false);
        await this.validateUuid(request, 'VisitId', Where.Body, false, false);
        await this.validateString(request, 'Complaint', Where.Body, false, false);
        await this.validateString(request, 'Severity', Where.Body, false, true);
        await this.validateDate(request, 'RecordDate', Where.Body, false, false);

        this.validateRequest(request);
    }

    private getFilter(request): ComplaintSearchFilters {
        
        var filters: ComplaintSearchFilters = {
            PatientUserId             : request.query.patientUserId ?? null,
            MedicalPractitionerUserId : request.query.medicalPractitionerUserId ?? null,
            VisitId                   : request.query.visitId ?? null,
            Complaint                 : request.query.complaint ?? null,
            Severity                  : request.query.severity ?? null,
            DateFrom                  : request.query.dateFrom ?? null,
            DateTo                    : request.query.dateTo ?? null,

        };

        return this.updateBaseSearchFilters(request, filters);
    }

}
