import { ApolloServer } from 'apollo-server-express';
import connectRedis from 'connect-redis';
import cors from 'cors';
import express from 'express';
import session from 'express-session';
import Redis from 'ioredis';
import path from 'path';
import 'reflect-metadata';
import { buildSchema } from 'type-graphql';
// import { MikroORM } from '@mikro-orm/core';
import { createConnection } from 'typeorm';
import { COOKIE_NAME, IS_PRODUCTION } from './constants';
import { Post } from './entities/Post';
import { Updoot } from './entities/Updoot';
import { User } from './entities/User';
// import mikroConfig from './mikro-orm.config';
import { HelloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/user';
import { createUpdootLoader } from './utils/createUpdootLoader';
import { createUserLoader } from './utils/createUserLoader';
import 'dotenv-safe/config';

(async () => {
	try {
		// const conn = await createConnection({
		const conn = await createConnection({
			type: 'postgres',
			// database: 'typegraphql-reddit-clone',
			// username: 'postgres',
			// password: 'postgres',
			url: process.env.DATABASE_URL,

			logging: true,
			// synchronize: true,
			// synchronize: false,
			migrations: [path.join(__dirname, './migrations/*')],
			entities: [Post, User, Updoot],
		});

		await conn.runMigrations();

		// await Post.delete({});

		// const orm = await MikroORM.init(mikroConfig);
		// orm.em.nativeDelete(User, {});
		// await orm.getMigrator().up();

		const app = express();

		const RedisStore = connectRedis(session);
		const redis = new Redis(process.env.REDIS_URL);

		app.set('trust proxy', 1);

		app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));

		app.use(
			session({
				name: COOKIE_NAME,
				store: new RedisStore({
					client: redis,
					disableTTL: true,
					disableTouch: true,
				}),
				cookie: {
					maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
					httpOnly: true,
					sameSite: 'lax', // csrf
					secure: IS_PRODUCTION, // cookie only works in https
					domain: IS_PRODUCTION ? '.my-domain.com' : undefined,
				},
				saveUninitialized: false,
				secret: process.env.SESSION_SECRET || '',
				resave: false,
			})
		);

		const apolloServer = new ApolloServer({
			schema: await buildSchema({
				resolvers: [HelloResolver, PostResolver, UserResolver],
				validate: false,
			}),
			// context: ({ req, res }): MyContext => ({ em: orm.em, req, res, redis }),
			context: ({ req, res }) => ({
				req,
				res,
				redis,
				userLoader: createUserLoader(),
				updootLoader: createUpdootLoader(),
			}),
		});

		// app.get('/', (_, res) => {
		// 	res.send('hello');
		// });

		apolloServer.applyMiddleware({
			app,
			// cors: { origin: 'http://localhost:3000' },
			cors: false,
		});

		app.listen(parseInt(process.env.PORT || ''), () => {
			console.log('server started on localhost:4000');
		});

		// const post = orm.em.create(Post, { title: 'my first post' });
		// await orm.em.persistAndFlush(post);

		// const posts = await orm.em.find(Post, { title: 'my first post' });
		// console.log(posts);
	} catch (err) {
		console.error(err);
	}
})();
