import { MikroORM } from '@mikro-orm/core';
import { ApolloServer } from 'apollo-server-express';
import connectRedis from 'connect-redis';
import cors from 'cors';
import express from 'express';
import session from 'express-session';
import redis from 'redis';
import 'reflect-metadata';
import { buildSchema } from 'type-graphql';
import { COOKIE_NAME, IS_PRODUCTION } from './constants';
import mikroConfig from './mikro-orm.config';
import { HelloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/user';
import { MyContext } from './types';

(async () => {
	try {
		const orm = await MikroORM.init(mikroConfig);
		await orm.getMigrator().up();

		const app = express();

		const RedisStore = connectRedis(session);
		const redisClient = redis.createClient();

		app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

		app.use(
			session({
				name: COOKIE_NAME,
				store: new RedisStore({
					client: redisClient,
					disableTTL: true,
					disableTouch: true,
				}),
				cookie: {
					maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
					httpOnly: true,
					sameSite: 'lax', // csrf
					secure: IS_PRODUCTION, // cookie only works in https
				},
				saveUninitialized: false,
				secret: 'secret',
				resave: false,
			})
		);

		const apolloServer = new ApolloServer({
			schema: await buildSchema({
				resolvers: [HelloResolver, PostResolver, UserResolver],
				validate: false,
			}),
			context: ({ req, res }): MyContext => ({ em: orm.em, req, res }),
		});

		// app.get('/', (_, res) => {
		// 	res.send('hello');
		// });

		apolloServer.applyMiddleware({
			app,
			// cors: { origin: 'http://localhost:3000' },
			cors: false,
		});

		app.listen(4000, () => {
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
