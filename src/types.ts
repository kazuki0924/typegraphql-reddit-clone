import { Connection, EntityManager, IDatabaseDriver } from '@mikro-orm/core';
import { Request, Response } from 'express';
import { Redis } from 'ioredis';

export type MyContext = {
	em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>;
	req: Request;
	res: Response;
	redis: Redis;
};

declare module 'express-session' {
	export interface SessionData {
		userId: number;
	}
}
