import 'reflect-metadata';

import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import { buildSchema } from 'type-graphql';

import { MikroORM } from '@mikro-orm/core';

import mikroConfig from './mikro-orm.config';
import { HelloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/post';

(async () => {
	try {
		const orm = await MikroORM.init(mikroConfig);
		await orm.getMigrator().up();

		const app = express();

		const apolloServer = new ApolloServer({
			schema: await buildSchema({
				resolvers: [HelloResolver, PostResolver],
				validate: false,
			}),
			context: () => ({ em: orm.em }),
		});

		// app.get('/', (_, res) => {
		// 	res.send('hello');
		// });

		apolloServer.applyMiddleware({ app });

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
