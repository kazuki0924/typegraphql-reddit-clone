import { ApolloServer } from 'apollo-server-express';
import connectRedis from 'connect-redis';
import cors from 'cors';
import express from 'express';
import session from 'express-session';
import Redis from 'ioredis';
import path from 'path';
import 'reflect-metadata';
import { buildSchema } from 'type-graphql';
import { createConnection } from 'typeorm';
import { COOKIE_NAME, IS_PRODUCTION } from './constants';
import { Post } from './entities/Post';
import { Updoot } from './entities/Updoot';
import { User } from './entities/User';
import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/user';
import { createUpdootLoader } from './utils/createUpdootLoader';
import { createUserLoader } from './utils/createUserLoader';
import 'dotenv-safe/config';

(async () => {
	try {
		await createConnection({
			type: 'postgres',
			url: process.env.DATABASE_URL,
			logging: true,
			migrations: [path.join(__dirname, './migrations/*')],
			entities: [Post, User, Updoot],
		});

		// await conn.runMigrations();

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
					domain: IS_PRODUCTION ? '.my-dev-domain.com' : undefined,
				},
				saveUninitialized: false,
				secret: process.env.SESSION_SECRET as string,
				resave: false,
			})
		);

		const apolloServer = new ApolloServer({
			schema: await buildSchema({
				resolvers: [PostResolver, UserResolver],
				validate: false,
			}),
			context: ({ req, res }) => ({
				req,
				res,
				redis,
				userLoader: createUserLoader(),
				updootLoader: createUpdootLoader(),
			}),
		});

		apolloServer.applyMiddleware({
			app,
			cors: false,
		});

		app.listen(parseInt(process.env.PORT as string), () => {
			console.log('server started on localhost:4000');
		});
	} catch (err) {
		console.error(err);
	}
})();
