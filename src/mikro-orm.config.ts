import path from 'path';

import { MikroORM } from '@mikro-orm/core';

import { IS_PRODUCTION } from './constants';
import { Post } from './entities/Post';
import { User } from './entities/User';

export default {
	migrations: {
		tableName: 'mikro_orm_migrations', // name of database table with log of executed transactions
		path: path.join(__dirname, './migrations'), // path to the folder with migrations
		pattern: /^[\w-]+\d+\.[tj]s$/, // regex pattern for the migration files
		transactional: true, // wrap each migration in a transaction
		disableForeignKeys: true, // wrap statements with `set foreign_key_checks = 0` or equivalent
		allOrNothing: true, // wrap all migrations in master transaction
		dropTables: true, // allow to disable table dropping
		safe: false, // allow to disable table and column dropping
		emit: 'ts', // migration generation mode
	},
	entities: [Post, User],
	dbName: 'typegraphql-reddit-clone-test',
	type: 'postgresql',
	debug: !IS_PRODUCTION,
} as Parameters<typeof MikroORM.init>[0];
