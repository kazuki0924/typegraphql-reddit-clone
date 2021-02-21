import { Request, Response } from 'express';

import { Connection, EntityManager, IDatabaseDriver } from '@mikro-orm/core';
import { RedisClient } from 'redis';

export type MyContext = {
	em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>;
	req: Request;
	res: Response;
	redis: RedisClient;
};

declare module 'express-session' {
	export interface SessionData {
		userId: number;
	}
}
