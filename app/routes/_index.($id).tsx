import type * as OT from '@opentelemetry/otlp-transformer';
import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { Link, json, redirect, useLoaderData } from '@remix-run/react';
import clsx from 'clsx';
import { Fragment } from 'react/jsx-runtime';
import { db } from '~/.server/db';

function flattenValue(value?: OT.IAnyValue | OT.IKeyValue[] | null): any {
	if (!value) {
		return null;
	} else if (Array.isArray(value)) {
		return flattenValue({
			kvlistValue: {
				values: value,
			},
		});
	} else if (value.stringValue) {
		return value.stringValue;
	} else if (value.boolValue) {
		return value.boolValue ?? false;
	} else if (value.doubleValue) {
		return value.doubleValue ?? 0;
	} else if (value.intValue) {
		return value.intValue ?? 0;
	} else if (value.bytesValue) {
		return value.bytesValue;
	} else if (value.arrayValue) {
		return value.arrayValue.values.map((elem) => flattenValue(elem));
	} else if (value.kvlistValue) {
		const output: Record<string, any> = {};
		for (const entry of value.kvlistValue.values) {
			output[entry.key] = flattenValue(entry.value);
		}
		return output;
	} else {
		return null;
	}
}

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
	const { id } = args.params;

	const attributes = await db.execute(`
	  select *, (select json_group_array(value) from known_value where key = attribute.key) as known_values
		from attribute
		order by key
	`);

	const children = id
		? await db.execute({
				sql: `select * from row where parent = ? order by timestamp desc limit 50`,
				args: [id],
			})
		: await db.execute(
				`select * from row where subtype = 'record' order by timestamp desc limit 50`,
			); // where parent is null

	// TODO: fetch all parents recursively(?)
	const parent = id
		? await db.execute({
				sql: `select * from row where id = ?`,
				args: [id],
			})
		: null;

	if (id && parent?.rows.length === 0) {
		throw redirect('/');
	}

	return json({
		attributes: attributes.rows.map(({ known_values, ...rest }) => {
			return {
				...rest,
				known_values: JSON.parse(known_values),
			};
		}),
		children: children?.rows.map((row) => formatRow(row)),
		parent: parent ? formatRow(parent.rows[0]) : null,
	});
}

function formatRow(row: any) {
	const json = row?.json ? JSON.parse(row.json) : null;

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
		breadcrumb: row?.breadcrumb ? JSON.parse(row.breadcrumb) : null,
	};
}

export default function Index() {
	const { attributes, children, parent } = useLoaderData<typeof loader>();

	return (
		<div className="font-sans p-4">
			<h2 className="text-2xl font-bold">Attributes</h2>
			<div className="max-h-[400px] overflow-y-auto whitespace-pre-wrap border rounded shadow p-4 my-4 text-xs">
				{attributes.map((attribute, index) => (
					<pre key={index}>{JSON.stringify(attribute)}</pre>
				))}
			</div>
			{parent && (
				<>
					<h2 className="text-2xl font-bold">Details</h2>
					<Row row={parent} showParent expanded />
				</>
			)}
			<h2 className="text-2xl font-bold">Children</h2>
			<div className="flex flex-col gap-2">
				{children?.map((row, index) => (
					<Row key={index} row={row} />
				))}
			</div>
		</div>
	);
}

function Row({
	row,
	expanded: expandedDefault,
	showParent,
}: { row: any; expanded?: boolean; showParent?: boolean }) {
	const [expanded, setExpanded] = useState(expandedDefault);

	return (
		<div className="flex flex-col border shadow p-2 rounded">
			<div className="flex items-center gap-2">
				<Breadcrumb breadcrumb={[null, ...row.breadcrumb]} />
				{/* <PrettyLink to={`/${row.id}`}>{row.id}</PrettyLink> */}
				<Badge>{row.type}</Badge>
				<Badge>{row.subtype}</Badge>
				{row.children_count ? (
					<Badge>Children: {row.children_count}</Badge>
				) : null}
				{row.timestamp && <Badge>{row.timestamp}</Badge>}

				<div className="flex-1" />
				<button
					type="button"
					onClick={() => setExpanded((expanded) => !expanded)}
					className="text-xs text-blue-700 hover:underline"
				>
					{expanded ? 'Show less' : 'Show more'}
				</button>
			</div>

			{/* Superceded by breadcrumb? */}
			{/* {showParent && (
				<div>
					Parent:{' '}
					<PrettyLink to={`/${row.parent ?? ''}`}>
						{row.parent ?? '(root)'}
					</PrettyLink>
				</div>
			)} */}
			{expanded ? (
				<pre className="max-h-[400px] overflow-y-auto whitespace-pre-wrap mt-2 text-xs">
					{JSON.stringify(row.json, null, 2)}
				</pre>
			) : (
				<div className="text-xs overflow-hidden line-clamp-2">
					{JSON.stringify(row.json)}
				</div>
			)}
		</div>
	);
}

function Breadcrumb({ breadcrumb }: { breadcrumb: string[] }) {
	return (
		<div className="flex items-center gap-1">
			{[...breadcrumb].reverse().map((id, index) => (
				<Fragment key={id}>
					<PrettyLink
						className={clsx(
							index === 0 && 'font-bold',
							'truncate max-w-[100px]',
						)}
						to={`/${id}`}
					>
						{id ?? '(root)'}
					</PrettyLink>
					{index < breadcrumb.length - 1 && ' > '}
				</Fragment>
			))}
		</div>
	);
}

function PrettyLink({
	to,
	children,
	className,
}: { to: string; children: React.ReactNode; className?: string }) {
	return (
		<Link className={clsx('text-blue-700 hover:underline', className)} to={to}>
			{children}
		</Link>
	);
}

function Badge({ children }: { children: React.ReactNode }) {
	return (
		<span className="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded-md">
			{children}
		</span>
	);
}
