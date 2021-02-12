import { Request, Response } from 'express';

import { Connection, EntityManager, IDatabaseDriver } from '@mikro-orm/core';

export type MyContext = {
	em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>;
	req: Request;
	res: Response;
};

declare module 'express-session' {
	export interface SessionData {
		userId: any;
	}
}
