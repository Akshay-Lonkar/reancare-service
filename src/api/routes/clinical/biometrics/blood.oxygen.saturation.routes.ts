/* eslint-disable max-len */
import express from 'express';
import { Loader } from '../../../../startup/loader';
import { BloodOxygenSaturationController } from '../../../controllers/clinical/biometrics/blood.oxygen.saturation.controller';

///////////////////////////////////////////////////////////////////////////////////

export const register = (app: express.Application): void => {

    const router = express.Router();
    const authenticator = Loader.authenticator;
    const controller = new BloodOxygenSaturationController();

    router.post('/', authenticator.authenticateClient,authenticator.authenticateUser, controller.create);
    router.get('/search', authenticator.authenticateClient, authenticator.authenticateUser, controller.search);
    router.get('/:id', authenticator.authenticateClient, authenticator.authenticateUser, controller.getById);
    router.put('/:id', authenticator.authenticateClient, authenticator.authenticateUser, controller.update);
    router.delete('/:id', authenticator.authenticateClient, authenticator.authenticateUser, controller.delete);

    app.use('/api/v1/clinical/biometrics/blood-oxygen-saturations', router);
};
