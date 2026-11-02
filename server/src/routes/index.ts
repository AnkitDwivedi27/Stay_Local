import { Router } from 'express';
import { healthRouter } from './health.route';
import { destinationsRouter } from './destinations.route';
import { staysRouter } from './stays.route';
import { experiencesRouter } from './experiences.route';
import { authRouter } from './auth.route';
import { bookingRouter } from './booking.route';
import { hostListingRouter } from './host-listing.route';
import { adminListingRouter } from './admin-listing.route';
import { adminAssignmentRouter } from './admin-assignment.route';
import { guideRouter } from './guide.route';
import { publicGuideRouter } from './public-guide.route';
import { guideBookingRouter } from './guide-booking.route';
import { adminGuideRouter } from './admin-guide.route';
import { localTreasureRouter } from './local-treasure.route';
import { adminTreasureRouter } from './admin-treasure.route';

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(authRouter);
apiRouter.use(bookingRouter);
apiRouter.use(hostListingRouter);
apiRouter.use(adminListingRouter);
apiRouter.use(adminAssignmentRouter);
apiRouter.use(guideRouter);
apiRouter.use(publicGuideRouter);
apiRouter.use(guideBookingRouter);
apiRouter.use(adminGuideRouter);
apiRouter.use(localTreasureRouter);
apiRouter.use(adminTreasureRouter);
apiRouter.use(destinationsRouter);
apiRouter.use(staysRouter);
apiRouter.use(experiencesRouter);

