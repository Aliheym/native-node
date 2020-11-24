const path = require('path');
const Router = require('./Router');

const authController = require('../controllers/auth');
const adminController = require('../controllers/admin');
const userController = require('../controllers/user');

const { auth, bodyParser, errorHandler, static } = require('../middlewares');

Router.use(bodyParser);
Router.use(auth.getUserData);

Router.post('/api/login', authController.authLocal);
Router.post('/api/invite', auth.onlyAdmin, adminController.inviteUser);
Router.post('/api/complete-invitation', userController.completeInvitation);
Router.post('/api/forgot-password', userController.forgotPassword);
Router.post('/api/complete-recover', userController.completeRecover);

Router.get('/oauth-redirect/google', authController.authGoogle);
Router.get('/oauth-redirect/facebook', authController.authFacebook);

Router.use(static(path.join(__dirname, '..', 'front')));

Router.catch(errorHandler);
