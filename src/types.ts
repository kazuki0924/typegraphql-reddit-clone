// import { Connection, EntityManager, IDatabaseDriver } from '@mikro-orm/core';
import { Request, Response } from 'express';
import { Redis } from 'ioredis';
import { createUpdootLoader } from './utils/createUpdootLoader';
import { createUserLoader } from './utils/createUserLoader';

export type MyContext = {
	// em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>;
	req: Request;
	res: Response;
	redis: Redis;
	userLoader: ReturnType<typeof createUserLoader>;
	updootLoader: ReturnType<typeof createUpdootLoader>;
};

declare module 'express-session' {
	export interface SessionData {
		userId: number;
	}
}
