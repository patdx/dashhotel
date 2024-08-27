import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect, useLoaderData } from '@remix-run/react';
import { desc, eq } from 'drizzle-orm';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { Fragment } from 'react/jsx-runtime';
import { getDb, schema } from '~/.server/db';
import { Attribute, PrettyLink, Row } from '~/components';
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '~/components/ui/resizable';
import { flattenValue } from '~/utils';

export const meta: MetaFunction = () => {
	return [
		{ title: 'New Remix App' },
		{
			name: 'description',
			content: 'Welcome to Remix on Cloudflare!',
		},
	];
};

export async function loader(args: LoaderFunctionArgs) {
	const db = getDb();
	const { id } = args.params;

	// const attributes = await db.all(sql`
	//   select *, (select json_group_array(value) from known_value where key = attribute.key) as known_values
	// 	from attribute
	// 	order by key
	// `);

	const attributes = await db.query.attribute.findMany({
		with: {
			known_values: true,
		},
	});

	const children = id
		? await db
				.select()
				.from(schema.row)
				.where(eq(schema.row.parent, id))
				.orderBy(desc(schema.row.timestamp))
				.limit(50)
		: await db
				.select()
				.from(schema.row)
				.where(eq(schema.row.subtype, 'record'))
				.orderBy(desc(schema.row.timestamp))
				.limit(50);

	// TODO: fetch all parents recursively(?)
	const details = id
		? await db.query.row.findFirst({
				where: eq(schema.row.id, id),
			})
		: null;

	// Fetch the parent if details exist
	const parent = details?.parent
		? await db.query.row.findFirst({
				where: eq(schema.row.id, details.parent),
			})
		: null;

	if (id && !details) {
		throw redirect('/');
	}

	return json({
		attributes,
		children: children?.map((row) => formatRow(row)),
		details: details ? formatRow(details) : null,
		parent: parent ? formatRow(parent) : null,
	});
}

function formatRow(row: any) {
	const json = row?.json;
	// const json = row?.json ? JSON.parse(row.json) : null;

	const niceJson = {
		...json,
		body: flattenValue(json?.body),
		attributes: flattenValue(json?.attributes),
		resource: {
			...json?.resource,
			attributes: flattenValue(json?.resource?.attributes),
		},
		// _raw: json,
	};

	return {
		...row,
		json: niceJson,
	};
}

export default function Index() {
	const { attributes, children, details, parent } =
		useLoaderData<typeof loader>();

	const AnimatePresence = Fragment;

	return (
		<div>
			<ResizablePanelGroup className="inset-0 absolute" direction="horizontal">
				<ResizablePanel defaultSize={67}>
					<OverlayScrollbarsComponent defer className="h-full w-full p-4">
						<h2 className="text-2xl font-bold mb-2">
							<PrettyLink to="/">Home</PrettyLink>
						</h2>
						{/* <motion.div> */}
						<h2 className="text-2xl font-bold mb-2">Parent</h2>
						<div className="h-[100px]">
							<AnimatePresence>
								{
									parent ? <Row key={parent.id} row={parent} /> : null
									// (
									// 	<div className="text-gray-500 italic">No parent</div>
									// )
								}
							</AnimatePresence>
						</div>
						<h2 className="text-2xl font-bold mt-4 mb-2">Details</h2>
						<div className="h-[300px] relative">
							<div className="absolute inset-0 overflow-y-auto">
								{details && <Row key={details.id} row={details} expanded />}
							</div>
						</div>
						<h2 className="text-2xl font-bold mt-4 mb-2">Children</h2>
						<div className="space-y-2 w-full">
							<AnimatePresence>
								{children.map((row, index) => (
									<Row key={row.id} row={row} />
								))}
							</AnimatePresence>
						</div>
						{/* {children.length === 0 && (
							<div className="text-gray-500 italic">No children</div>
						)} */}
						{/* </motion.div> */}
					</OverlayScrollbarsComponent>
				</ResizablePanel>
				<ResizableHandle withHandle />
				<ResizablePanel defaultSize={33}>
					<OverlayScrollbarsComponent className="p-4 w-full h-full">
						<h2 className="text-xl font-bold mb-4">Attributes</h2>
						{attributes.map((attribute, index) => (
							<Attribute
								key={index}
								name={attribute.key}
								type={attribute.type}
								knownValues={attribute.known_values}
							/>
						))}
					</OverlayScrollbarsComponent>
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}
