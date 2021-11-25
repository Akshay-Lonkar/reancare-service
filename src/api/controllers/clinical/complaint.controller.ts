import express from 'express';
import { uuid } from '../../../domain.types/miscellaneous/system.types';
import { ApiError } from '../../../common/api.error';
import { ResponseHandler } from '../../../common/response.handler';
import { ComplaintService } from '../../../services/clinical/complaint.service';
import { Loader } from '../../../startup/loader';
import { ComplaintValidator } from '../../validators/clinical/complaint.validator';
import { BaseController } from '../base.controller';

///////////////////////////////////////////////////////////////////////////////////////

export class ComplaintController extends BaseController{

    //#region member variables and constructors

    _service: ComplaintService = null;
   
    _validator: ComplaintValidator = new ComplaintValidator();

    constructor() {
        super();
        this._service = Loader.container.resolve(ComplaintService);

    }
    //#endregion

    //#region Action methods

    create = async (request: express.Request, response: express.Response): Promise<void> => {
        try {
            
            this.setContext('Complaint.Create', request, response);

            const model = await this._validator.create(request);
            const complaint = await this._service.create(model);
            if (complaint == null) {
                throw new ApiError(400, 'Cannot create record for complaint!');
            }

            ResponseHandler.success(request, response, 'Complaint record created successfully!', 201, {
                Complaint : complaint,
            });
        } catch (error) {
            ResponseHandler.handleError(request, response, error);
        }
    };

    getById = async (request: express.Request, response: express.Response): Promise<void> => {
        try {
            
            this.setContext('Complaint.GetById', request, response);

            const id: uuid = await this._validator.getParamUuid(request, 'id');
            const complaint = await this._service.getById(id);
            if (complaint == null) {
                throw new ApiError(404, 'Complaint record not found.');
            }

            ResponseHandler.success(request, response, 'Complaint record retrieved successfully!', 200, {
                Complaint : complaint,
            });
        } catch (error) {
            ResponseHandler.handleError(request, response, error);
        }
    };

    search = async (request: express.Request, response: express.Response): Promise<void> => {
        try {
            
            this.setContext('Complaint.Search', request, response);

            const filters = await this._validator.search(request);
            const searchResults = await this._service.search(filters);
            const count = searchResults.Items.length;
            const message =
                count === 0
                    ? 'No records found!'
                    : `Total ${count} complaint records retrieved successfully!`;
                    
            ResponseHandler.success(request, response, message, 200, { Complaints: searchResults });

        } catch (error) {
            ResponseHandler.handleError(request, response, error);
        }
    };

    update = async (request: express.Request, response: express.Response): Promise<void> => {
        try {
            
            this.setContext('Complaint.Update', request, response);

            const domainModel = await this._validator.update(request);
            const id: uuid = await this._validator.getParamUuid(request, 'id');
            const existingRecord = await this._service.getById(id);
            if (existingRecord == null) {
                throw new ApiError(404, 'Complaint record not found.');
            }

            const updated = await this._service.update(domainModel.id, domainModel);
            if (updated == null) {
                throw new ApiError(400, 'Unable to update complaint record!');
            }

            ResponseHandler.success(request, response, 'Complaint record updated successfully!', 200, {
                Complaint : updated,
            });
        } catch (error) {
            ResponseHandler.handleError(request, response, error);
        }
    };

    delete = async (request: express.Request, response: express.Response): Promise<void> => {
        try {
            
            this.setContext('Nutrition.FoodConsumption.Delete', request, response);

            const id: uuid = await this._validator.getParamUuid(request, 'id');
            const existingRecord = await this._service.getById(id);
            if (existingRecord == null) {
                throw new ApiError(404, 'Complaint record not found.');
            }

            const deleted = await this._service.delete(id);
            if (!deleted) {
                throw new ApiError(400, 'Complaint record cannot be deleted.');
            }

            ResponseHandler.success(request, response, 'Complaint record deleted successfully!', 200, {
                Deleted : true,
            });
        } catch (error) {
            ResponseHandler.handleError(request, response, error);
        }
    };

    //#endregion

}
